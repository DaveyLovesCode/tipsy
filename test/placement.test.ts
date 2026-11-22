import { describe, expect, test } from 'vitest';
import { configureTipsy, placeTooltip } from '../src/index';
import type { TooltipPlacementRequest, TooltipPosition, TooltipRect } from '../src/index';

function rect(left: number, top: number, width: number, height: number): TooltipRect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

const bounds = rect(0, 0, 1000, 700);
const size = { width: 120, height: 30 };

describe('choosing a side', () => {
  test('the preferred side wins when it has room', () => {
    for (const side of ['top', 'bottom', 'left', 'right'] as const) {
      const placed = placeTooltip({ anchorRect: rect(450, 330, 100, 40), bounds, tooltipSize: size, preferredPosition: side });
      expect(placed).toMatchObject({ position: side, strategy: 'cardinal' });
    }
  });

  test('an anchor against the top edge flips the bubble below it', () => {
    const placed = placeTooltip({ anchorRect: rect(450, 2, 100, 30), bounds, tooltipSize: size, preferredPosition: 'top', gap: 10 });
    expect(placed.position).toBe('bottom');
    expect(placed.top).toBe(42);
  });

  test('the bubble centers on the anchor and sits `gap` away from it', () => {
    const placed = placeTooltip({ anchorRect: rect(450, 330, 100, 40), bounds, tooltipSize: size, gap: 10 });
    expect(placed.left).toBe(500 - 60);
    expect(placed.top).toBe(330 - 10 - 30);
    expect(placed.transformOrigin).toBe('bottom center');
  });

  test('a bubble wider than the boundary is held to it', () => {
    const placed = placeTooltip({ anchorRect: rect(10, 330, 20, 20), bounds: rect(0, 0, 300, 700), tooltipSize: { width: 900, height: 30 }, edgePadding: 6 });
    expect(placed.maxWidth).toBe(288);
    expect(placed.left).toBe(6);
  });

  test('with no anchor the bubble sits around the center of the bounds', () => {
    const placed = placeTooltip({ anchorRect: null, bounds, tooltipSize: size, gap: 0 });
    expect(placed.left).toBe(500 - 60);
    expect(placed.top).toBe(350 - 30);
  });

  test('with no side to fit, the bubble sits on the cursor', () => {
    const placed = placeTooltip({
      anchorRect: rect(0, 0, 1000, 700),
      bounds,
      tooltipSize: size,
      cursorPoint: { x: 300, y: 200 },
    });
    expect(placed).toMatchObject({ strategy: 'cursor', left: 240, top: 185, transformOrigin: 'center center' });
  });

  test('followCursor centers on the cursor, held within the anchor', () => {
    const anchorRect = rect(100, 330, 600, 40);
    const at = (x: number) =>
      placeTooltip({ anchorRect, bounds, tooltipSize: size, followCursor: true, cursorPoint: { x, y: 350 } }).left;
    expect(at(250)).toBe(250 - 60);
    expect(at(900)).toBe(700 - 60);
    expect(placeTooltip({ anchorRect, bounds, tooltipSize: size, cursorPoint: { x: 250, y: 350 } }).left).toBe(400 - 60);
  });

  test('gap and edgePadding fall back to the global config', () => {
    configureTipsy({ gap: 25, edgePadding: 40 });
    const above = placeTooltip({ anchorRect: rect(450, 330, 100, 40), bounds, tooltipSize: size });
    expect(above.top).toBe(330 - 25 - 30);
    const atEdge = placeTooltip({ anchorRect: rect(0, 330, 20, 40), bounds, tooltipSize: size });
    expect(atEdge.left).toBe(40);
  });
});

// Thousands of random layouts, each checked against what must always be true.
describe('invariants over random layouts', () => {
  function random(seed: number) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const sides: TooltipPosition[] = ['top', 'bottom', 'left', 'right'];

  function layouts(count: number): TooltipPlacementRequest[] {
    const next = random(7);
    const between = (min: number, max: number) => Math.round(min + next() * (max - min));
    return Array.from({ length: count }, () => {
      const box = rect(between(-50, 300), between(-50, 300), between(80, 2000), between(60, 1400));
      const anchorRect = rect(
        between(box.left - 100, box.right + 50),
        between(box.top - 100, box.bottom + 50),
        between(0, 400),
        between(0, 200),
      );
      return {
        anchorRect,
        bounds: box,
        // A real bubble always has padding, so never zero.
        tooltipSize: { width: between(10, 700), height: between(10, 300) },
        preferredPosition: sides[between(0, 3)],
        gap: between(0, 30),
        edgePadding: between(0, 20),
        followCursor: next() < 0.3,
        cursorPoint: next() < 0.5 ? { x: between(box.left, box.right), y: between(box.top, box.bottom) } : null,
      };
    });
  }

  const epsilon = 1e-9;

  /** The room a side has for the bubble, as the engine measures it. */
  function fits(request: TooltipPlacementRequest, side: TooltipPosition, width: number, height: number): boolean {
    const { anchorRect: a, bounds: b, gap = 0, edgePadding = 0 } = request as Required<TooltipPlacementRequest>;
    const room = {
      top: a!.top - (b.top + edgePadding) - gap,
      bottom: b.bottom - edgePadding - a!.bottom - gap,
      left: a!.left - (b.left + edgePadding) - gap,
      right: b.right - edgePadding - a!.right - gap,
    }[side];
    return (side === 'top' || side === 'bottom' ? height : width) <= Math.max(0, room);
  }

  test('every placement holds', () => {
    for (const request of layouts(20_000)) {
      const placed = placeTooltip(request);
      const { bounds: b, edgePadding = 0, gap = 0, anchorRect: a } = request as Required<TooltipPlacementRequest>;
      const width = Math.min(request.tooltipSize.width, Math.max(0, b.width - edgePadding * 2));
      const height = Math.min(request.tooltipSize.height, Math.max(0, b.height - edgePadding * 2));
      const context = JSON.stringify(request);

      // The bubble never leaves the boundary, less its padding.
      expect(placed.left, context).toBeGreaterThanOrEqual(b.left + edgePadding - epsilon);
      expect(placed.top, context).toBeGreaterThanOrEqual(b.top + edgePadding - epsilon);
      if (width <= b.width - edgePadding * 2) expect(placed.left + width, context).toBeLessThanOrEqual(b.right - edgePadding + epsilon);
      if (height <= b.height - edgePadding * 2) expect(placed.top + height, context).toBeLessThanOrEqual(b.bottom - edgePadding + epsilon);
      expect(placed.maxWidth).toBe(Math.max(0, b.width - edgePadding * 2));

      const fitting = sides.filter((side) => fits(request, side, width, height));
      if (fitting.length === 0) {
        if (request.cursorPoint) expect(placed.strategy, context).toBe('cursor');
        continue;
      }

      // A side that fits is always chosen over one that doesn't, the preferred one first.
      expect(placed.strategy, context).toBe('cardinal');
      expect(fitting, context).toContain(placed.position);
      if (fitting.includes(request.preferredPosition!)) expect(placed.position, context).toBe(request.preferredPosition);

      // And the bubble never covers its anchor.
      const clearance = {
        top: a!.top - gap - (placed.top + height),
        bottom: placed.top - (a!.bottom + gap),
        left: a!.left - gap - (placed.left + width),
        right: placed.left - (a!.right + gap),
      }[placed.position];
      expect(clearance, context).toBeGreaterThanOrEqual(-epsilon);
    }
  });

  test('the same layout always places the same way', () => {
    for (const request of layouts(500)) expect(placeTooltip(request)).toEqual(placeTooltip(request));
  });
});
