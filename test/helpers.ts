import { flushSync, mount, unmount } from 'svelte';
import type { ComponentProps } from 'svelte';
import { get } from 'svelte/store';
import { vi } from 'vitest';
import { TIPSY_BUBBLE_ID, TooltipPortal, tooltip, tooltipStore } from '../src/index';
import type { TooltipInput, TooltipState } from '../src/index';

const cleanups: Array<() => void> = [];

/** Undoes everything the helpers mounted, newest first. */
export function cleanup(): void {
  while (cleanups.length) cleanups.pop()!();
  document.body.replaceChildren();
}

interface AnchorOptions {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  parent?: HTMLElement;
}

/** A fixed-position button with the action on it. */
export function anchor(input: TooltipInput, { left = 400, top = 300, width = 80, height = 30, parent = document.body }: AnchorOptions = {}) {
  const node = document.createElement('button');
  node.textContent = 'anchor';
  Object.assign(node.style, {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    margin: '0',
    padding: '0',
    border: '0',
  });
  parent.appendChild(node);
  const action = tooltip(node, input);
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    action.destroy();
  };
  cleanups.push(() => {
    destroy();
    node.remove();
  });
  return { node, update: (next: TooltipInput) => action.update(next), destroy };
}

export function portal(props: ComponentProps<typeof TooltipPortal> = {}) {
  const component = mount(TooltipPortal, { target: document.body, props });
  flushSync();
  cleanups.push(() => unmount(component));
  return component;
}

export function state(): TooltipState {
  return get(tooltipStore);
}

/** The text on screen, or null while nothing shows. */
export function shown(): string | null {
  const current = state();
  return current.visible ? current.text : null;
}

export function bubble(): HTMLElement | null {
  return document.getElementById(TIPSY_BUBBLE_ID);
}

/** Moves the fake clock and lets the store's microtasks land. */
export async function wait(ms = 0): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  await settle();
}

export async function settle(): Promise<void> {
  for (let i = 0; i < 3; i++) await Promise.resolve();
}

/** Real animation frames, which the portal places the bubble on. */
export async function frames(count = 2): Promise<void> {
  for (let i = 0; i < count; i++) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  flushSync();
}

function center(element: Element) {
  const rect = element.getBoundingClientRect();
  return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
}

type Point = { clientX: number; clientY: number };

// Synthetic pointer input, for sequences a real mouse can't produce, such as a
// host that never delivers the release.

export function enter(element: Element, { buttons = 0 } = {}): void {
  const at = { ...center(element), buttons };
  element.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, ...at }));
  element.dispatchEvent(new PointerEvent('pointerenter', at));
  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, ...at }));
  element.dispatchEvent(new MouseEvent('mouseenter', at));
}

export function moveWithin(element: Element, { buttons = 0 } = {}): void {
  const at = { ...center(element), buttons };
  element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, ...at }));
  element.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, ...at }));
}

/** Leaves `element` for `to`; `null` is leaving the page. */
export function leave(element: Element, { to = document.body as Element | null, buttons = 0 } = {}): void {
  element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: to, buttons }));
  element.dispatchEvent(new MouseEvent('mouseleave', { relatedTarget: to, buttons }));
}

/** A primary-button press, with the focus a browser gives a pressed button. */
export function press(element: HTMLElement, { focus = true } = {}): void {
  const at = { ...center(element), buttons: 1 };
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', isPrimary: true, ...at }));
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, ...at }));
  if (focus) element.focus();
}

/** Lets the button go over `target`, at `at`. */
export function release(target: Element, at: Point = center(target)): void {
  target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse', isPrimary: true, ...at }));
  target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, ...at }));
}

export function click(element: HTMLElement): void {
  press(element);
  release(element);
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, ...center(element) }));
}
