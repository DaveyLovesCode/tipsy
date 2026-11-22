import { describe, expect, test } from 'vitest';
import { createTooltipMotion } from '../src/tooltipMotion';
import type { TooltipMotionFrame, TooltipMotionTarget } from '../src/tooltipMotion';

const area = { left: 6, top: 6, right: 994, bottom: 694 };
const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height });

/** Steps the motion a frame at a time on its own clock, until it rests. */
function play(
  motion: ReturnType<typeof createTooltipMotion>,
  target: TooltipMotionTarget,
  anchor: ReturnType<typeof rect>,
  from: number,
  duration = 240,
) {
  const frames: TooltipMotionFrame[] = [];
  for (let now = from; now < from + 2000; now += 16) {
    frames.push(motion.step(target, { anchor, area, gap: 10, duration, now }));
    if (!frames.at(-1)!.moving) break;
  }
  return frames;
}

const overlaps = (a: TooltipMotionFrame, b: ReturnType<typeof rect>) =>
  a.left < b.right && a.left + a.width > b.left && a.top < b.bottom && a.top + a.height > b.top;

describe('the bubble’s motion', () => {
  const first = rect(100, 300, 40, 30);
  const second = rect(160, 300, 40, 30);
  const above = (anchor: ReturnType<typeof rect>, width: number, ownerId: number): TooltipMotionTarget => ({
    left: anchor.left + anchor.width / 2 - width / 2,
    top: anchor.top - 10 - 24,
    width,
    height: 24,
    position: 'top',
    ownerId,
  });

  test('a first show lands at once, and so does a move with moveDuration 0', () => {
    const motion = createTooltipMotion();
    expect(play(motion, above(first, 60, 1), first, 0)).toEqual([{ left: 90, top: 266, width: 60, height: 24, moving: false }]);
    const jump = play(motion, above(second, 90, 2), second, 16, 0);
    expect(jump).toHaveLength(1);
    expect(jump[0].left).toBe(135);
  });

  test('a handover glides to the next anchor, reshaping on the way, and rests on it within the duration', () => {
    const motion = createTooltipMotion();
    play(motion, above(first, 60, 1), first, 0);
    const frames = play(motion, above(second, 90, 2), second, 16);
    const lefts = frames.map((frame) => frame.left);
    const widths = frames.map((frame) => frame.width);
    expect(frames.length).toBeGreaterThan(4);
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    expect(widths).toEqual([...widths].sort((a, b) => a - b));
    expect(frames.at(-1)).toMatchObject({ left: 135, width: 90, moving: false });
    expect(frames.length * 16).toBeLessThanOrEqual(240 + 64);
  });

  test('a flip swings around the anchor: never over it, never out of the area', () => {
    // The anchor rises two pixels, and the bubble above it no longer fits.
    const motion = createTooltipMotion();
    play(motion, { left: 470, top: 6, width: 60, height: 24, position: 'top', ownerId: 1 }, rect(480, 40, 40, 30), 0);
    const anchor = rect(480, 38, 40, 30);
    const below: TooltipMotionTarget = { left: 470, top: 78, width: 60, height: 24, position: 'bottom', ownerId: 1 };
    const frames = play(motion, below, anchor, 16);
    expect(frames.length).toBeGreaterThan(4);
    for (const frame of frames) {
      expect(overlaps(frame, anchor), `clear of the anchor at ${frame.left},${frame.top}`).toBe(false);
      expect(frame.left).toBeGreaterThanOrEqual(area.left);
      expect(frame.top).toBeGreaterThanOrEqual(area.top);
      expect(frame.left + frame.width).toBeLessThanOrEqual(area.right);
    }
    expect(frames.at(-1)).toMatchObject({ left: 470, top: 78, moving: false });
  });

  test('a tooltip that shows after the last one finished hiding starts where it belongs', () => {
    const motion = createTooltipMotion();
    play(motion, above(first, 60, 1), first, 0);
    motion.release(160);
    // Asked again while it stays hidden, it still forgets on time.
    motion.release(900);
    expect(play(motion, above(second, 90, 2), second, 400)).toHaveLength(1);
  });
});
