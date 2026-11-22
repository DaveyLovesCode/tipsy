import { runtimeConfig } from './config';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipPoint {
  x: number;
  y: number;
}

export interface TooltipSize {
  width: number;
  height: number;
}

export interface TooltipRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

export type TooltipBounds = TooltipRect;

export interface TooltipPlacementRequest {
  /** Null places the bubble around the center of `bounds`. */
  anchorRect: TooltipRect | null;
  /** Defaults to the viewport. */
  bounds?: TooltipBounds;
  cursorPoint?: TooltipPoint | null;
  preferredPosition?: TooltipPosition;
  tooltipSize: TooltipSize;
  /** Defaults to the global config. */
  gap?: number;
  /** Defaults to the global config. */
  edgePadding?: number;
  /**
   * Centers the bubble on the cursor's X (top and bottom) or Y (left and right),
   * within the anchor, in place of the anchor's center. When no side has room the
   * bubble centers on `cursorPoint` whatever this says.
   */
  followCursor?: boolean;
}

export interface TooltipPlacementResult {
  left: number;
  top: number;
  position: TooltipPosition;
  transformOrigin: string;
  maxWidth: number;
  maxHeight: number;
  /** `cursor` when no side had room and the bubble sits on the cursor. */
  strategy: 'cardinal' | 'cursor';
}

const SIDES: TooltipPosition[] = ['top', 'bottom', 'left', 'right'];

const OPPOSITE: Record<TooltipPosition, TooltipPosition> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

const TRANSFORM_ORIGINS: Record<TooltipPosition, string> = {
  top: 'bottom center',
  bottom: 'top center',
  left: 'right center',
  right: 'left center',
};

/** The rect of the element `selector` matches, or the visible viewport without one. */
export function getTooltipBoundaryRect(selector: string | null = null): TooltipBounds {
  const root = selector ? document.querySelector<HTMLElement>(selector) : null;
  if (root) {
    const { left, top, width, height } = root.getBoundingClientRect();
    return rect(left, top, width, height);
  }

  const viewport = window.visualViewport;
  if (viewport) return rect(viewport.offsetLeft, viewport.offsetTop, viewport.width, viewport.height);
  return rect(0, 0, window.innerWidth, window.innerHeight);
}

/**
 * Picks the side of the anchor the bubble goes on: `preferredPosition` when it
 * fits, then the side across from it, then whichever has the most room. The
 * bubble stays inside `bounds`.
 */
export function placeTooltip({
  anchorRect,
  bounds = getTooltipBoundaryRect(),
  cursorPoint = null,
  preferredPosition = 'top',
  tooltipSize,
  gap = runtimeConfig.gap,
  edgePadding = runtimeConfig.edgePadding,
  followCursor = false,
}: TooltipPlacementRequest): TooltipPlacementResult {
  // The area the bubble may cover.
  const area = {
    top: bounds.top + edgePadding,
    right: bounds.right - edgePadding,
    bottom: bounds.bottom - edgePadding,
    left: bounds.left + edgePadding,
  };
  const maxWidth = Math.max(0, bounds.width - edgePadding * 2);
  const maxHeight = Math.max(0, bounds.height - edgePadding * 2);
  const width = Math.min(Math.max(0, tooltipSize.width || 0), maxWidth);
  const height = Math.min(Math.max(0, tooltipSize.height || 0), maxHeight);

  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const anchor = anchorRect || { top: centerY, bottom: centerY, left: centerX, right: centerX, width: 0, height: 0 };

  const within = (left: number, top: number) => ({
    left: clamp(left, area.left, area.right - width),
    top: clamp(top, area.top, area.bottom - height),
  });

  // Where the bubble centers along the anchor's edge.
  const follow = followCursor ? cursorPoint : null;
  const alongX = follow ? clamp(follow.x, anchor.left, anchor.right) : anchor.left + anchor.width / 2;
  const alongY = follow ? clamp(follow.y, anchor.top, anchor.bottom) : anchor.top + anchor.height / 2;
  const centered = within(alongX - width / 2, alongY - height / 2);

  /** Where one side puts the bubble, the room that side has, and how far the bubble spills past it. */
  function sideGeometry(position: TooltipPosition) {
    switch (position) {
      case 'top': {
        const top = anchor.top - gap - height;
        const room = anchor.top - area.top - gap;
        return { left: centered.left, top, room, required: height, overflow: area.top - top };
      }
      case 'bottom': {
        const top = anchor.bottom + gap;
        const room = area.bottom - anchor.bottom - gap;
        return { left: centered.left, top, room, required: height, overflow: top + height - area.bottom };
      }
      case 'left': {
        const left = anchor.left - gap - width;
        const room = anchor.left - area.left - gap;
        return { left, top: centered.top, room, required: width, overflow: area.left - left };
      }
      case 'right': {
        const left = anchor.right + gap;
        const room = area.right - anchor.right - gap;
        return { left, top: centered.top, room, required: width, overflow: left + width - area.right };
      }
    }
  }

  const candidates = SIDES.map((position) => {
    const { left, top, room, required, overflow } = sideGeometry(position);
    const space = Math.max(0, room);
    const fits = required <= space;
    // A side that fits outranks one that doesn't: the preferred side first, then the one across from it.
    const rank = !fits ? 0 : position === preferredPosition ? 3 : position === OPPOSITE[preferredPosition] ? 2 : 1;
    const score = Math.max(0, space - required) * 100 + Math.min(space, required) * 10 - Math.max(0, overflow) * 1000;
    return { position, left, top, space, fits, rank, score };
  });

  if (cursorPoint && !candidates.some((candidate) => candidate.fits)) {
    return {
      ...within(cursorPoint.x - width / 2, cursorPoint.y - height / 2),
      position: preferredPosition,
      transformOrigin: 'center center',
      maxWidth,
      maxHeight,
      strategy: 'cursor',
    };
  }

  const best = candidates.sort((a, b) => b.rank - a.rank || b.score - a.score || b.space - a.space)[0];
  return {
    ...within(best.left, best.top),
    position: best.position,
    transformOrigin: TRANSFORM_ORIGINS[best.position],
    maxWidth,
    maxHeight,
    strategy: 'cardinal',
  };
}

function rect(left: number, top: number, width: number, height: number): TooltipRect {
  return { top, right: left + width, bottom: top + height, left, width, height };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
