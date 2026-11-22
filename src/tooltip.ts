import type { Snippet } from 'svelte';
import { runtimeConfig } from './config';
import type { Trigger } from './config';
import type { TooltipPoint, TooltipPosition, TooltipRect } from './tooltipPlacement';
import {
  dismissTooltip,
  forceHideTooltip,
  hideTooltip,
  isWarm,
  showTooltip,
  tooltipStore,
  updateVisibleTooltip,
} from './tooltipStore';
import type { TooltipMode } from './tooltipStore';

export interface TooltipConfig {
  /** Plain-text content. Ignored when `content` is given. */
  text?: string;
  /** A Svelte snippet rendered in place of `text`. */
  content?: Snippet;
  /** Shortcut chips rendered after the text or content. */
  kbd?: string[];
  /**
   * Preferred side. Another is chosen when this one has no room. Defaults to the
   * nearest ancestor's `data-tooltip-position`, then the global config.
   */
  position?: TooltipPosition;
  /** Centers the bubble on the cursor's X (top and bottom) or Y (left and right) within the anchor. */
  followCursor?: boolean;
  /** Ms before the tooltip shows. 0 shows at once. */
  delay?: number;
  mode?: TooltipMode;
  /** Forces visibility: `true` shows, `false` hides, `undefined` follows the triggers. */
  show?: boolean;
  /** One trigger or several. `'manual'` binds no events and leaves the tooltip to `show`. */
  trigger?: Trigger | Trigger[];
  /** Lets the cursor enter the bubble without dismissing it. */
  interactive?: boolean;
  /** Pressing the anchor puts its tooltip away until the pointer leaves and comes back. */
  hideOnPress?: boolean;
  maxWidth?: number;
  gap?: number;
  edgePadding?: number;
  /** Selector of the element the bubble stays inside. */
  boundarySelector?: string;
  /** The rect to anchor to when it is not the node's own, such as an icon inside a larger hit target. */
  getRect?: (node: HTMLElement) => TooltipRect;
}

/** A bare string is `{ text }`. Anything falsy shows no tooltip. */
export type TooltipInput = string | TooltipConfig | null | undefined | false;

interface TooltipAction {
  update(input: TooltipInput): void;
  destroy(): void;
}

type ResolvedConfig = Omit<TooltipConfig, 'trigger'> &
  Required<Pick<TooltipConfig, 'text' | 'mode' | 'followCursor' | 'interactive' | 'hideOnPress'>> & {
    triggers: Trigger[];
  };

/** The bubble's id, which the anchor it describes points `aria-describedby` at. */
export const TIPSY_BUBBLE_ID = 'tipsy-bubble';

let nextOwnerId = 1;
/** The anchor whose tooltip is on screen, if one is. */
let visibleOwnerId: number | null = null;
/** Run when an owner's tooltip leaves the screen, whatever took it away. */
const hiddenHandlers = new Map<number, () => void>();
const pendingShows = new Set<ReturnType<typeof setTimeout>>();
const anchorOwners = new WeakMap<HTMLElement, number>();
const clickAnchors = new WeakSet<HTMLElement>();
let globalsBound = false;

function resolve(input: TooltipInput): ResolvedConfig {
  const given: TooltipConfig = typeof input === 'string' ? { text: input } : input || {};
  const { trigger, ...config } = given;
  return {
    ...config,
    text: config.text ?? '',
    mode: config.mode || 'default',
    followCursor: config.followCursor ?? runtimeConfig.followCursor,
    interactive: config.interactive ?? runtimeConfig.interactive,
    hideOnPress: config.hideOnPress ?? runtimeConfig.hideOnPress,
    triggers: trigger === undefined ? runtimeConfig.trigger : Array.isArray(trigger) ? trigger : [trigger],
  };
}

function hasContent(config: ResolvedConfig): boolean {
  return Boolean(config.content) || (typeof config.text === 'string' && config.text.trim().length > 0);
}

function defaultDelay(): number {
  return Math.max(0, Number(runtimeConfig.getDelay?.() ?? runtimeConfig.defaultDelay) || 0);
}

function isDisabled(config: ResolvedConfig): boolean {
  if (!runtimeConfig.enabled) return true;
  return config.delay === undefined && runtimeConfig.disableWhenDefaultDelayIsZero && defaultDelay() === 0;
}

function dismissAll(event?: Event): void {
  // A press stays out of it inside the showing anchor, whose own press handler
  // decides; inside a click anchor, whose own handler toggles; and inside the
  // bubble, so interactive content can be used.
  let target = event?.target instanceof Node ? event.target : null;
  for (; target; target = target.parentNode) {
    if (!(target instanceof HTMLElement)) continue;
    if (anchorOwners.get(target) === visibleOwnerId) return;
    if (clickAnchors.has(target) || target.id === TIPSY_BUBBLE_ID) return;
  }
  for (const timeout of pendingShows) clearTimeout(timeout);
  pendingShows.clear();
  dismissTooltip();
}

function bindGlobals(): void {
  if (globalsBound) return;
  globalsBound = true;

  tooltipStore.subscribe((state) => {
    const owner = state.visible ? state.ownerId : null;
    if (owner === visibleOwnerId) return;
    const previous = visibleOwnerId;
    visibleOwnerId = owner;
    if (previous !== null) hiddenHandlers.get(previous)?.();
  });

  window.addEventListener('mousedown', dismissAll, true);
  window.addEventListener('pointerdown', dismissAll, true);
  window.addEventListener('blur', () => dismissAll());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') dismissAll();
  });
  document.addEventListener(
    'mouseout',
    (event) => {
      // No related target means the pointer left the page. That dismisses from
      // anywhere, so the press exceptions don't apply.
      if (event.relatedTarget === null) dismissAll();
    },
    true,
  );
}

/** Svelte action: `use:tooltip={'Run'}` or `use:tooltip={{ text: 'Send', kbd: ['⌘', '⏎'] }}`. */
export function tooltip(node: HTMLElement, input: TooltipInput): TooltipAction {
  bindGlobals();

  const ownerId = nextOwnerId++;
  let config = resolve(input);
  let showTimeout: ReturnType<typeof setTimeout> | null = null;
  let cursorPoint: TooltipPoint | null = null;
  let clickedOpen = false;
  /**
   * Pressed, and the pointer hasn't left since. Nothing schedules a show, and the
   * focus the press gave isn't someone tabbing in.
   */
  let pressed = false;
  /** Pressed without `hideOnPress`: the tooltip holds until the release. */
  let pointerActive = false;
  let hoverActive = false;
  let focusActive = false;
  let unbindTriggers = () => {};

  /** A container can choose the side for every tooltip inside it. */
  function preferredPosition(): TooltipPosition {
    const inherited = node.closest('[data-tooltip-position]')?.getAttribute('data-tooltip-position');
    return config.position ?? (inherited as TooltipPosition | null | undefined) ?? runtimeConfig.position;
  }

  function getAnchorRect(): TooltipRect {
    return config.getRect ? config.getRect(node) : node.getBoundingClientRect();
  }

  /** What the bubble shows for this anchor right now. */
  function bubble() {
    return {
      text: config.text,
      content: config.content ?? null,
      kbd: config.kbd ?? null,
      mode: config.mode,
      position: preferredPosition(),
      followCursor: config.followCursor,
      interactive: config.interactive,
      cursorPoint,
      getAnchorRect,
      maxWidth: config.maxWidth ?? null,
      gap: config.gap ?? null,
      edgePadding: config.edgePadding ?? null,
      boundarySelector: config.boundarySelector ?? null,
    };
  }

  function canShow(): boolean {
    return hasContent(config) && !isDisabled(config);
  }

  function show(): void {
    cancelPendingShow();
    if (!canShow()) return;
    showTooltip({ ...bubble(), ownerId }, getAnchorRect());
    describeAnchor();
  }

  function scheduleShow(): void {
    cancelPendingShow();
    if (pressed || !canShow()) return;
    const delay = config.delay === undefined ? defaultDelay() : Math.max(0, Number(config.delay) || 0);
    if (delay === 0 || isWarm()) {
      show();
    } else {
      showTimeout = setTimeout(show, delay);
      pendingShows.add(showTimeout);
    }
  }

  function cancelPendingShow(): void {
    if (showTimeout) {
      clearTimeout(showTimeout);
      pendingShows.delete(showTimeout);
      showTimeout = null;
    }
  }

  function hide(immediate = false): void {
    cancelPendingShow();
    undescribeAnchor();
    if (immediate) forceHideTooltip(ownerId);
    else hideTooltip(ownerId, config.interactive ? runtimeConfig.interactiveHideDelay : undefined);
  }

  /** Hides unless the `show` prop, a click or an active hover or focus is holding the tooltip open. */
  function hideIfInactive(immediate = false): void {
    if (config.show !== undefined || clickedOpen || hoverActive || focusActive) return;
    hide(immediate);
  }

  function applyShowProp(): void {
    if (config.show === true) show();
    else if (config.show === false) hide(true);
  }

  function pointerHitsAnchorOrBubble(event: PointerEvent): boolean {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (!target) return false;
    if (node.contains(target)) return true;
    return target instanceof HTMLElement && target.closest(`#${TIPSY_BUBBLE_ID}`) !== null;
  }

  /** The ids the anchor's `aria-describedby` names, the app's own among them. */
  function describedBy(): string[] {
    return (node.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  }

  function describeAnchor(): void {
    const ids = describedBy();
    if (!ids.includes(TIPSY_BUBBLE_ID)) node.setAttribute('aria-describedby', [...ids, TIPSY_BUBBLE_ID].join(' '));
  }

  /** Takes the bubble's id back out, leaving whatever the app has there now. */
  function undescribeAnchor(): void {
    const ids = describedBy();
    if (!ids.includes(TIPSY_BUBBLE_ID)) return;
    const rest = ids.filter((id) => id !== TIPSY_BUBBLE_ID);
    if (rest.length > 0) node.setAttribute('aria-describedby', rest.join(' '));
    else node.removeAttribute('aria-describedby');
  }

  function bindTriggers(): void {
    const triggers = new Set(config.triggers);
    const cleanups: Array<() => void> = [];

    function listen<Type extends keyof HTMLElementEventMap>(
      target: HTMLElement | Window,
      type: Type,
      handler: (event: HTMLElementEventMap[Type]) => void,
      capture = false,
    ): void {
      target.addEventListener(type, handler as EventListener, capture);
      cleanups.push(() => target.removeEventListener(type, handler as EventListener, capture));
    }

    function trackCursor(event: MouseEvent): void {
      cursorPoint = { x: event.clientX, y: event.clientY };
    }

    // A touch screen has no hover: a tap would open the tooltip through the
    // emulated mouse and focus and leave it stuck, so only clicks and the
    // `show` prop open tooltips there.
    const hovers = typeof matchMedia !== 'function' || !matchMedia('(hover: none)').matches;

    if (hovers && triggers.has('hover')) {
      // A click anchor's press is its own trigger, so it always holds.
      const pressHides = () => config.hideOnPress && !triggers.has('click');

      const release = (event: PointerEvent) => {
        if (!pointerActive) return;
        pointerActive = false;
        trackCursor(event);
        hoverActive = pointerHitsAnchorOrBubble(event);
        hideIfInactive();
      };

      listen(node, 'mouseenter', (event) => {
        hoverActive = true;
        // Arriving mid-drag counts as a press.
        pressed = pressHides() && event.buttons !== 0;
        trackCursor(event);
        if (config.show === undefined && !clickedOpen) scheduleShow();
      });
      listen(node, 'mouseleave', (event) => {
        hoverActive = false;
        pressed = false;
        cursorPoint = null;
        cancelPendingShow();
        // A press that drags off the anchor keeps the tooltip until the pointer is released.
        if (pointerActive && event.buttons !== 0) return;
        pointerActive = false;
        hideIfInactive();
      });
      const press = (event: MouseEvent) => {
        hoverActive = true;
        pressed = true;
        trackCursor(event);
        // Puts the tooltip away on the press alone: some hosts, such as After
        // Effects panels on macOS, never deliver the release.
        if (pressHides()) dismissAll();
        else pointerActive = true;
      };
      // Both, since a page that cancels `pointerdown` gets no `mousedown`.
      listen(node, 'pointerdown', press);
      listen(node, 'mousedown', press);
      listen(node, 'mousemove', trackCursor);
      listen(node, 'pointermove', trackCursor);
      listen(node, 'pointerup', release);
      listen(node, 'pointercancel', release);
      listen(node, 'lostpointercapture', release);
      listen(window, 'pointerup', release, true);
      listen(window, 'pointercancel', release, true);
    }

    if (hovers && triggers.has('focus')) {
      listen(node, 'focusin', () => {
        // The focus a press gives isn't someone tabbing here to read.
        if (pressed) return;
        focusActive = true;
        if (config.show === undefined && !clickedOpen) scheduleShow();
      });
      listen(node, 'focusout', () => {
        focusActive = false;
        hideIfInactive();
      });
    }

    if (triggers.has('click')) {
      clickAnchors.add(node);
      cleanups.push(() => clickAnchors.delete(node));
      listen(node, 'click', (event) => {
        if (config.show !== undefined) return;
        trackCursor(event);
        clickedOpen = !clickedOpen;
        if (clickedOpen) show();
        else hide(true);
      });
    }

    unbindTriggers = () => cleanups.forEach((cleanup) => cleanup());
  }

  hiddenHandlers.set(ownerId, () => {
    // The next click on this anchor opens its tooltip again.
    clickedOpen = false;
    undescribeAnchor();
  });
  anchorOwners.set(node, ownerId);
  bindTriggers();
  applyShowProp();

  return {
    update(next: TooltipInput): void {
      const previous = config;
      config = resolve(next);

      const { triggers } = config;
      if (triggers.length !== previous.triggers.length || triggers.some((trigger, i) => trigger !== previous.triggers[i])) {
        if (clickedOpen && !triggers.includes('click')) {
          clickedOpen = false;
          hide(true);
        }
        if (!triggers.includes('hover')) hoverActive = pressed = pointerActive = false;
        if (!triggers.includes('focus')) focusActive = false;
        unbindTriggers();
        bindTriggers();
        hideIfInactive(true);
      }

      if (!hasContent(config)) {
        hoverActive = focusActive = pointerActive = false;
        hide(true);
        return;
      }

      if (config.show !== undefined) {
        applyShowProp();
        return;
      }

      // The `show` prop let go, so the triggers decide again.
      if (previous.show !== undefined) {
        if ((hoverActive || focusActive) && !clickedOpen) scheduleShow();
        else hideIfInactive(true);
      }

      // Hidden anchors skip the update: measuring one forces a layout, which
      // thrashes when many anchors update in the same frame.
      if (visibleOwnerId === ownerId) {
        updateVisibleTooltip({ ...bubble(), anchorRect: getAnchorRect() }, ownerId);
      }
    },
    destroy(): void {
      unbindTriggers();
      anchorOwners.delete(node);
      hiddenHandlers.delete(ownerId);
      hide(true);
    },
  };
}
