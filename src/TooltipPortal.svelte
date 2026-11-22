<script lang="ts">
  import { fade } from 'svelte/transition';
  import { configVersion, mergeTheme, modeToCssVars, resolveEasing, runtimeConfig, themeToCssVars } from './config';
  import type { AnimationConfig, ThemeConfig } from './config';
  import { TIPSY_BUBBLE_ID } from './tooltip';
  import { getTooltipBoundaryRect, placeTooltip } from './tooltipPlacement';
  import type { TooltipBounds, TooltipPlacementResult, TooltipPosition, TooltipRect } from './tooltipPlacement';
  import { cancelPendingHide, forceHideTooltip, hideTooltip, tooltipStore } from './tooltipStore';

  /** Each prop overrides the global config for this portal. */
  interface Props {
    class?: string;
    style?: string;
    maxWidth?: number;
    /** Null is the viewport. */
    boundarySelector?: string | null;
    wrapAt?: number;
    /** Merged over the global theme. */
    theme?: ThemeConfig;
    /** Merged over the global animation. */
    animation?: Partial<AnimationConfig>;
  }

  let {
    class: className = '',
    style = '',
    maxWidth: maxWidthOverride,
    boundarySelector: boundarySelectorOverride,
    wrapAt: wrapAtOverride,
    theme: themeOverride,
    animation: animationOverride,
  }: Props = $props();

  // `runtimeConfig` is a plain object, so `configVersion` is what makes these read it again.
  const settings = $derived.by(() => {
    void $configVersion;
    return {
      theme: mergeTheme(runtimeConfig.theme, themeOverride),
      animation: { ...runtimeConfig.animation, ...animationOverride },
      maxWidth: maxWidthOverride ?? runtimeConfig.maxWidth,
      wrapAt: wrapAtOverride ?? runtimeConfig.wrapAt,
      boundarySelector:
        boundarySelectorOverride !== undefined ? boundarySelectorOverride : runtimeConfig.boundarySelector,
    };
  });

  const {
    text,
    content,
    kbd,
    visible,
    mode,
    position,
    followCursor,
    interactive,
    anchorRect,
    getAnchorRect,
    cursorPoint,
    ownerId,
    gap,
    edgePadding,
  } = $derived($tooltipStore);

  const maxWidth = $derived(Math.max(1, $tooltipStore.maxWidth ?? settings.maxWidth));
  const boundarySelector = $derived($tooltipStore.boundarySelector ?? settings.boundarySelector);
  const hasText = $derived(typeof text === 'string' && text.length > 0);
  const wraps = $derived(hasText && text.length > settings.wrapAt);
  const shown = $derived(visible && (content !== null || hasText));
  const themeStyle = $derived(themeToCssVars(settings.theme));
  const modeStyle = $derived(modeToCssVars(mode, settings.theme));

  // The bubble renders twice: once off screen to be measured, then where that size fits.
  let measureEl = $state<HTMLDivElement | null>(null);
  let placement = $state<TooltipPlacementResult | null>(null);

  $effect(() => {
    if (!shown) {
      placement = null;
      return;
    }

    // Placed again every frame, so the bubble follows an anchor that moves or resizes.
    const owner = ownerId;
    let frame = requestAnimationFrame(function place() {
      if (!measureEl) return;

      const bounds = getTooltipBoundaryRect(boundarySelector);
      const anchor = getAnchorRect?.() ?? anchorRect;
      if (!overlaps(anchor, bounds) || !overlaps(anchor, getTooltipBoundaryRect())) {
        forceHideTooltip(owner);
        return;
      }

      const { width, height } = measureEl.getBoundingClientRect();
      const placed = placeTooltip({
        anchorRect: anchor,
        bounds,
        cursorPoint,
        preferredPosition: position,
        followCursor,
        tooltipSize: { width, height },
        gap: gap ?? undefined,
        edgePadding: edgePadding ?? undefined,
      });
      // The shell is positioned in the document, so viewport coordinates gain the scroll offset.
      const next = {
        ...placed,
        left: snapToDevicePixel(placed.left + window.scrollX),
        top: snapToDevicePixel(placed.top + window.scrollY),
        maxWidth: snapToDevicePixel(placed.maxWidth),
        maxHeight: snapToDevicePixel(placed.maxHeight),
      };

      if (!placement || !samePlacement(placement, next)) placement = next;
      frame = requestAnimationFrame(place);
    });

    return () => cancelAnimationFrame(frame);
  });

  /** Fades the bubble in while it scales up and slides toward its anchor. */
  function reveal(node: HTMLElement, { side }: { side: TooltipPosition }) {
    const { inDuration, distance, scale, easing } = settings.animation;
    const { opacity, transform } = node.style;
    const axis = side === 'top' || side === 'bottom' ? 'Y' : 'X';
    const direction = side === 'top' || side === 'left' ? 1 : -1;

    return {
      duration: inDuration,
      easing: resolveEasing(easing),
      tick: (t: number) => {
        if (t >= 1) {
          node.style.opacity = opacity;
          node.style.transform = transform;
          return;
        }

        const offset = distance * (1 - t) * direction;
        const slide = offset === 0 ? '' : `translate${axis}(${offset}px)`;
        const size = scale + (1 - scale) * t;
        node.style.opacity = String(t);
        node.style.transform = size === 1 && !slide ? transform : `scale(${size}) ${slide}`;
      },
    };
  }

  // An interactive bubble stays up while the cursor is inside it.
  function onBubbleEnter() {
    if (interactive) cancelPendingHide();
  }

  function onBubbleLeave() {
    if (interactive) hideTooltip(ownerId);
  }

  function snapToDevicePixel(value: number): number {
    const ratio = window.devicePixelRatio || 1;
    return Math.round(value * ratio) / ratio;
  }

  function samePlacement(a: TooltipPlacementResult, b: TooltipPlacementResult): boolean {
    return (Object.keys(a) as Array<keyof TooltipPlacementResult>).every((key) => a[key] === b[key]);
  }

  /** Whether any of `rect` is inside `bounds`. A rect without size counts as the point it sits on. */
  function overlaps(rect: TooltipRect | null, bounds: TooltipBounds): boolean {
    if (!rect) return false;

    const crossesX =
      rect.width === 0
        ? rect.left >= bounds.left && rect.left <= bounds.right
        : rect.right > bounds.left && rect.left < bounds.right;
    const crossesY =
      rect.height === 0
        ? rect.top >= bounds.top && rect.top <= bounds.bottom
        : rect.bottom > bounds.top && rect.top < bounds.bottom;

    return crossesX && crossesY;
  }
</script>

{#snippet bubble()}
  {#if content}
    {@render content()}
  {:else if hasText}
    <span class="tipsy-text">{text}</span>
  {/if}
  {#if kbd && kbd.length > 0}
    <span class="tipsy-kbd-list">
      {#each kbd as token}
        <kbd class="tipsy-kbd">{token}</kbd>
      {/each}
    </span>
  {/if}
{/snippet}

{#if shown}
  <div
    bind:this={measureEl}
    aria-hidden="true"
    class="tipsy-tooltip tipsy-measure {className}"
    class:tipsy-multiline={wraps}
    data-mode={mode}
    style="max-width: {maxWidth}px; {themeStyle} {modeStyle} {style}"
  >
    {@render bubble()}
  </div>
{/if}

{#if placement && shown}
  <div
    class="tipsy-shell"
    style="transform: translate3d({placement.left}px, {placement.top}px, 0); {themeStyle} {modeStyle}"
  >
    <div
      id={TIPSY_BUBBLE_ID}
      class="tipsy-tooltip {className}"
      class:tipsy-multiline={wraps}
      class:tipsy-interactive={interactive}
      data-mode={mode}
      data-position={placement.position}
      style="transform-origin: {placement.transformOrigin}; max-width: {Math.min(placement.maxWidth, maxWidth)}px; max-height: {placement.maxHeight}px; {style}"
      role="tooltip"
      onmouseenter={onBubbleEnter}
      onmouseleave={onBubbleLeave}
      in:reveal={{ side: placement.position }}
      out:fade={{ duration: settings.animation.outDuration }}
    >
      {@render bubble()}
    </div>
  </div>
{/if}

<style>
  .tipsy-shell {
    position: absolute;
    left: 0;
    top: 0;
    z-index: var(--tipsy-z-index, 2147483647);
    pointer-events: none;
    will-change: transform;
  }

  .tipsy-tooltip {
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: var(--tipsy-gap-inline, 6px);
    box-sizing: border-box;
    overflow: hidden;
    padding: var(--tipsy-padding, 4px 8px);
    border: 1px solid var(--tipsy-border-current, var(--tipsy-border, rgb(255 255 255 / 0.12)));
    border-radius: var(--tipsy-radius, 6px);
    background: var(--tipsy-bg-current, var(--tipsy-bg, rgb(38 38 38 / 0.98)));
    color: var(--tipsy-color-current, var(--tipsy-color, rgb(229 229 229)));
    box-shadow: var(--tipsy-shadow, 0 10px 28px rgb(0 0 0 / 0.45), 0 3px 10px rgb(0 0 0 / 0.3));
    font-family: var(--tipsy-font-family, inherit);
    font-size: var(--tipsy-font-size, 11px);
    font-weight: var(--tipsy-font-weight, 500);
    letter-spacing: var(--tipsy-letter-spacing, 0);
    line-height: var(--tipsy-line-height, 1.35);
    white-space: nowrap;
  }

  .tipsy-interactive {
    pointer-events: auto;
  }

  .tipsy-measure {
    position: fixed;
    top: 0;
    left: -9999px;
    visibility: hidden;
  }

  .tipsy-text {
    min-width: 0;
  }

  .tipsy-kbd-list {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    gap: 2px;
    margin-left: 2px;
  }

  .tipsy-kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 15px;
    height: 15px;
    padding: 0 4px;
    border: 0;
    border-radius: 3px;
    background: var(--tipsy-kbd-bg, rgb(0 0 0 / 0.24));
    color: var(--tipsy-kbd-color, rgb(212 212 212));
    font-family: var(--tipsy-kbd-font-family, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: var(--tipsy-kbd-font-size, 10px);
    line-height: 1;
  }

  .tipsy-multiline {
    white-space: normal;
    overflow-wrap: anywhere;
  }
</style>
