import type { TooltipPosition, TooltipRect } from './tooltipPlacement';

export interface TooltipBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where the bubble belongs this frame. */
export interface TooltipMotionTarget extends TooltipBox {
  position: TooltipPosition;
  /** A new owner glides the bubble over. The same owner on a new side swings it around the anchor. */
  ownerId: number | null;
}

export interface TooltipMotionScene {
  anchor: TooltipRect;
  /** The area the bubble may cover. It never leaves it, mid-move included. */
  area: { left: number; top: number; right: number; bottom: number };
  gap: number;
  /** Ms a move takes. 0 jumps. */
  duration: number;
  now: number;
}

export interface TooltipMotionFrame extends TooltipBox {
  /** False once the bubble rests on its target. */
  moving: boolean;
}

/** A critically damped spring is within 2% of its target after this many time constants. */
const SETTLE = 6;
/** How square the path around an anchor is. Below 1 the bubble clears the anchor's corners. */
const CORNER = 0.6;

const wrap = (angle: number) => ((((angle + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
const clamp = (value: number, min: number, max: number) => (max < min ? min : Math.min(Math.max(value, min), max));

/** How far a bubble this size sits from the anchor's center when it is `gap` off an edge. */
function reach(anchor: TooltipRect, gap: number, width: number, height: number) {
  return { x: anchor.width / 2 + gap + width / 2, y: anchor.height / 2 + gap + height / 2 };
}

/** The bubble's place around its anchor as an angle and a distance, 1 being `gap` off the edge. */
function toOrbit(box: TooltipBox, anchor: TooltipRect, gap: number): [number, number] {
  const far = reach(anchor, gap, box.width, box.height);
  const u = (box.left + box.width / 2 - anchor.left - anchor.width / 2) / far.x;
  const v = (box.top + box.height / 2 - anchor.top - anchor.height / 2) / far.y;
  const distance = Math.pow(Math.pow(Math.abs(u), 2 / CORNER) + Math.pow(Math.abs(v), 2 / CORNER), CORNER / 2);
  if (distance === 0) return [0, 0];
  const unit = (value: number) => Math.sign(value) * Math.pow(Math.abs(value) / distance, 1 / CORNER);
  return [Math.atan2(unit(v), unit(u)), distance];
}

function fromOrbit([angle, distance, width, height]: number[], anchor: TooltipRect, gap: number): TooltipBox {
  const far = reach(anchor, gap, width, height);
  const along = (value: number) => distance * Math.sign(value) * Math.pow(Math.abs(value), CORNER);
  return {
    left: anchor.left + anchor.width / 2 + along(Math.cos(angle)) * far.x - width / 2,
    top: anchor.top + anchor.height / 2 + along(Math.sin(angle)) * far.y - height / 2,
    width,
    height,
  };
}

/** The way round from `angle` to `toAngle`: the short way, or past the side with more room when straight across. */
function turn(angle: number, toAngle: number, { anchor, area }: TooltipMotionScene): number {
  const short = wrap(toAngle - angle);
  if (Math.abs(short) < Math.PI * 0.85) return short;
  const room = (direction: number) => {
    const middle = angle + (direction * Math.PI) / 2;
    const across = Math.cos(middle) > 0 ? area.right - anchor.right : anchor.left - area.left;
    const down = Math.sin(middle) > 0 ? area.bottom - anchor.bottom : anchor.top - area.top;
    return Math.abs(Math.cos(middle)) * across + Math.abs(Math.sin(middle)) * down;
  };
  const direction = room(1) >= room(-1) ? 1 : -1;
  return direction * Math.abs(short) + (Math.sign(short) === direction ? 0 : direction * 2 * (Math.PI - Math.abs(short)));
}

/**
 * Moves the one bubble between the places it is asked to be. It rests on its target
 * and follows an anchor exactly; only a new owner or a new side sets it travelling.
 */
export function createTooltipMotion() {
  let box: TooltipBox | null = null;
  let owner: number | null = null;
  let side: TooltipPosition | null = null;
  let path: 'rest' | 'glide' | 'swing' = 'rest';
  /** Glide: left, top, width, height. Swing: angle, distance, width, height. */
  let values = [0, 0, 0, 0];
  let speeds = [0, 0, 0, 0];
  /** The angle a swing is headed for, unwrapped so it keeps its way round. */
  let heading = 0;
  let last = 0;
  let forgetAt: number | null = null;

  function spring(index: number, goal: number, stiffness: number, seconds: number): void {
    const offset = values[index] - goal;
    const pull = (speeds[index] + stiffness * offset) * seconds;
    const decay = Math.exp(-stiffness * seconds);
    values[index] = goal + (offset + pull) * decay;
    speeds[index] = (speeds[index] - stiffness * pull) * decay;
  }

  return {
    /** The bubble is hiding. A tooltip that shows before `until` travels from where this one was. */
    release(until: number): void {
      forgetAt ??= until;
    },

    step(target: TooltipMotionTarget, scene: TooltipMotionScene): TooltipMotionFrame {
      const { anchor, area, gap, duration, now } = scene;
      if (forgetAt !== null && now >= forgetAt) box = null;
      forgetAt = null;

      const travels = box !== null && duration > 0;
      const handedOver = travels && target.ownerId !== owner;
      const flipped = travels && !handedOver && target.position !== side;
      owner = target.ownerId;
      side = target.position;

      if (!travels) path = 'rest';
      if (handedOver) {
        if (path === 'swing') speeds = [0, 0, speeds[2], speeds[3]];
        values = [box!.left, box!.top, box!.width, box!.height];
        path = 'glide';
      }
      if (flipped) {
        const [angle, distance] = toOrbit(box!, anchor, gap);
        if (path !== 'swing') speeds = [0, 0, speeds[2], speeds[3]];
        values = [angle, distance, box!.width, box!.height];
        heading = angle + turn(angle, toOrbit(target, anchor, gap)[0], scene);
        path = 'swing';
      }

      const seconds = clamp(now - last, 0, 50) / 1000;
      last = now;
      const rest = { left: target.left, top: target.top, width: target.width, height: target.height };
      if (path === 'rest') {
        box = rest;
        return { ...rest, moving: false };
      }

      const stiffness = SETTLE / (duration / 1000);
      let goals = [rest.left, rest.top, rest.width, rest.height];
      if (path === 'swing') {
        const [angle, distance] = toOrbit(rest, anchor, gap);
        heading += wrap(angle - heading);
        goals = [heading, distance, rest.width, rest.height];
      }
      goals.forEach((goal, index) => spring(index, goal, stiffness, seconds));

      const before = box!;
      const next = path === 'swing' ? fromOrbit(values, anchor, gap) : { left: values[0], top: values[1], width: values[2], height: values[3] };
      next.left = clamp(next.left, area.left, area.right - next.width);
      next.top = clamp(next.top, area.top, area.bottom - next.height);

      const keys = ['left', 'top', 'width', 'height'] as const;
      const off = Math.max(...keys.map((key) => Math.abs(next[key] - rest[key])));
      const moved = Math.max(...keys.map((key) => Math.abs(next[key] - before[key])));
      if (off < 0.5 && moved < 0.5) {
        path = 'rest';
        speeds = [0, 0, 0, 0];
        box = rest;
        return { ...rest, moving: false };
      }
      box = next;
      return { ...next, moving: true };
    },
  };
}
