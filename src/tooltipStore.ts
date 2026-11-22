import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { Snippet } from 'svelte';
import { runtimeConfig } from './config';
import type { TooltipPoint, TooltipPosition, TooltipRect } from './tooltipPlacement';

/** `default`, the built-in `error` and `warning`, or any mode defined in `theme.modes`. */
export type TooltipMode = 'default' | 'error' | 'warning' | (string & {});

/** The one bubble: what it shows, where, and for which anchor. */
export interface TooltipState {
  text: string;
  /** Rendered in place of `text`. */
  content: Snippet | null;
  kbd: string[] | null;
  visible: boolean;
  mode: TooltipMode;
  position: TooltipPosition;
  followCursor: boolean;
  interactive: boolean;
  anchorRect: TooltipRect | null;
  /** Read every frame while visible, so the bubble follows an anchor that moves. */
  getAnchorRect: (() => TooltipRect) | null;
  cursorPoint: TooltipPoint | null;
  /** Whose tooltip this is. Hides and updates naming another owner leave it alone. */
  ownerId: number | null;
  // Null in these four falls back to the defaults.
  maxWidth: number | null;
  gap: number | null;
  edgePadding: number | null;
  boundarySelector: string | null;
}

export type TooltipShowOptions = Partial<Omit<TooltipState, 'visible' | 'anchorRect'>>;
export type VisibleTooltipPatch = Partial<Omit<TooltipState, 'visible' | 'ownerId'>>;

const hidden: TooltipState = {
  text: '',
  content: null,
  kbd: null,
  visible: false,
  mode: 'default',
  position: 'top',
  followCursor: false,
  interactive: false,
  anchorRect: null,
  getAnchorRect: null,
  cursorPoint: null,
  ownerId: null,
  maxWidth: null,
  gap: null,
  edgePadding: null,
  boundarySelector: null,
};

export const tooltipStore: Writable<TooltipState> = writable(hidden);

let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let lastHideAt = 0;
let currentlyVisible = false;

/** True while a tooltip is visible or one hid within `warmThreshold`, when the next shows without its delay. */
export function isWarm(): boolean {
  return currentlyVisible || Date.now() - lastHideAt < runtimeConfig.warmThreshold;
}

/** Shows a tooltip anchored to `rect`, replacing whichever one is showing. */
export function showTooltip(options: TooltipShowOptions, rect: TooltipRect): void {
  cancelPendingHide();
  currentlyVisible = true;
  tooltipStore.set({ ...hidden, ...defined(options), kbd: chips(options.kbd), visible: true, anchorRect: rect });
}

/** Hides after `hideDelay`, or `delayOverride` ms. With an `ownerId`, only that owner's tooltip. */
export function hideTooltip(ownerId?: number | null, delayOverride?: number): void {
  cancelPendingHide();
  const delay = typeof delayOverride === 'number' ? Math.max(0, delayOverride) : runtimeConfig.hideDelay;
  hideTimeout = setTimeout(() => {
    hideTimeout = null;
    let wasVisible = false;
    tooltipStore.update((state) => {
      if (belongsToAnother(state, ownerId)) return state;
      wasVisible = state.visible;
      return { ...state, visible: false };
    });
    if (wasVisible) markHidden();
  }, delay);
}

/** Hides without the grace period. With an `ownerId`, only that owner's tooltip. */
export function forceHideTooltip(ownerId?: number | null): void {
  cancelPendingHide();
  markHidden();
  queueMicrotask(() => {
    tooltipStore.update((state) => (belongsToAnother(state, ownerId) ? state : { ...state, visible: false }));
  });
}

/** Hides whatever is showing and forgets the warm state, so the next tooltip waits its full delay. */
export function dismissTooltip(): void {
  cancelPendingHide();
  currentlyVisible = false;
  lastHideAt = 0;
  queueMicrotask(() => {
    tooltipStore.update((state) => ({ ...state, visible: false, ownerId: null }));
  });
}

/** Keeps the tooltip up through a hide that is still waiting out its delay. */
export function cancelPendingHide(): void {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
}

/** Changes the visible tooltip in place, without animating it in again. With an `ownerId`, only that owner's. */
export function updateVisibleTooltip(patch: VisibleTooltipPatch, ownerId?: number | null): void {
  tooltipStore.update((state) => {
    if (!state.visible || belongsToAnother(state, ownerId)) return state;
    const next = { ...state, ...defined(patch) };
    if (patch.kbd !== undefined) next.kbd = chips(patch.kbd);
    return next;
  });
}

function markHidden(): void {
  if (currentlyVisible) lastHideAt = Date.now();
  currentlyVisible = false;
}

function belongsToAnother(state: TooltipState, ownerId: number | null | undefined): boolean {
  return ownerId !== undefined && ownerId !== null && state.ownerId !== ownerId;
}

function chips(kbd: string[] | null | undefined): string[] | null {
  return kbd && kbd.length > 0 ? kbd : null;
}

/** The fields that were given a value, so spreading them leaves the rest as they were. */
function defined<T extends object>(fields: T): Partial<T> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as Partial<T>;
}
