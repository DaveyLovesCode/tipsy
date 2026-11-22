import { describe, expect, test } from 'vitest';
import { configureTipsy, tooltipStore } from '../src/index';
import type { TooltipInput } from '../src/index';
import { anchor, click, enter, leave, moveWithin, press, release, settle, shown, wait } from './helpers';

async function hovered(input: TooltipInput) {
  const target = anchor(input);
  enter(target.node);
  await wait(900);
  expect(shown()).not.toBeNull();
  return target;
}

describe('a press puts the tooltip away (the default)', () => {
  test('on the press alone, in a host that never delivers the release', async () => {
    // After Effects panels on macOS send the press and never the release.
    const { node } = await hovered('Render');
    press(node);
    await settle();
    expect(shown()).toBeNull();
    moveWithin(node, { buttons: 1 });
    await wait(5000);
    expect(shown()).toBeNull();
  });

  test('the focus the press gives the anchor doesn’t bring it back', async () => {
    const { node } = await hovered('Save');
    press(node);
    release(node);
    await wait(5000);
    expect(document.activeElement).toBe(node);
    expect(shown()).toBeNull();
  });

  test('it stays away while the pointer stays, and comes back after leaving, on the full delay', async () => {
    const { node } = await hovered('Save');
    click(node);
    moveWithin(node);
    await wait(2000);
    expect(shown()).toBeNull();

    leave(node);
    enter(node);
    await wait(899);
    expect(shown()).toBeNull();
    await wait(1);
    expect(shown()).toBe('Save');
  });

  test('a press cancels a tooltip still waiting to show', async () => {
    const { node } = anchor('Pending');
    enter(node);
    await wait(500);
    click(node);
    await wait(5000);
    expect(shown()).toBeNull();
  });

  test('arriving with the button already down counts as a press', async () => {
    const { node } = anchor('Drop here');
    enter(node, { buttons: 1 });
    await wait(5000);
    expect(shown()).toBeNull();
    leave(node);
    enter(node);
    await wait(900);
    expect(shown()).toBe('Drop here');
  });

  test('keyboard focus shows it again once the pointer has gone', async () => {
    const { node } = await hovered('Save');
    click(node);
    leave(node);
    node.blur();
    await wait(1000);
    node.focus();
    await wait(900);
    expect(shown()).toBe('Save');
  });

  test('a click anchor’s press is its toggle, so it never blinks off', async () => {
    const { node } = await hovered({ text: 'Details', trigger: ['hover', 'click'] });
    const visibility: boolean[] = [];
    const stop = tooltipStore.subscribe((current) => visibility.push(current.visible));
    click(node);
    await settle();
    stop();
    expect(visibility.every(Boolean)).toBe(true);
  });
});

describe('hideOnPress: false holds it through the press', () => {
  test('a press keeps the tooltip, and a drag off keeps it until the release', async () => {
    const { node } = await hovered({ text: 'Drag me', hideOnPress: false });
    press(node);
    await wait(1000);
    expect(shown()).toBe('Drag me');

    leave(node, { buttons: 1 });
    await wait(1000);
    expect(shown()).toBe('Drag me');

    // and the focus the press gave the anchor doesn't hold it either
    release(document.body, { clientX: 5, clientY: 5 });
    await wait(50);
    expect(document.activeElement).toBe(node);
    expect(shown()).toBeNull();
  });

  test('a release back over the anchor keeps it showing', async () => {
    const { node } = await hovered({ text: 'Slider', hideOnPress: false });
    press(node);
    release(node);
    await wait(1000);
    expect(shown()).toBe('Slider');
  });

  test('the global switch sets the default, and an anchor’s own setting wins', async () => {
    configureTipsy({ hideOnPress: false });
    const holds = await hovered('Holds');
    press(holds.node);
    await wait(1000);
    expect(shown()).toBe('Holds');
    release(holds.node);
    leave(holds.node);
    await wait(1000);

    const hides = await hovered({ text: 'Hides', hideOnPress: true });
    press(hides.node);
    await settle();
    expect(shown()).toBeNull();
  });

  test('turning it off on a live anchor takes effect on the next press', async () => {
    const { node, update } = await hovered('Live');
    update({ text: 'Live', hideOnPress: false });
    press(node);
    await wait(1000);
    expect(shown()).toBe('Live');
  });
});
