// Real mouse and keyboard input through Playwright, so the browser's own event
// order and the focus a press gives are what Tipsy sees.
import { beforeEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { configureTipsy } from '../src/index';
import { anchor, shown } from './helpers';

beforeEach(() => {
  vi.useRealTimers();
  configureTipsy({ defaultDelay: 0, hideDelay: 0 });
});

test('hovering shows the tooltip and moving away hides it', async () => {
  const { node } = anchor('Run');
  const away = anchor('', { left: 100 });
  await userEvent.hover(node);
  expect(shown()).toBe('Run');
  await userEvent.hover(away.node);
  await expect.poll(shown).toBeNull();
});

test('clicking a hovered anchor puts the tooltip away, and the click’s focus doesn’t bring it back', async () => {
  const { node } = anchor('Save');
  await userEvent.hover(node);
  expect(shown()).toBe('Save');
  await userEvent.click(node);
  expect(document.activeElement).toBe(node);
  expect(shown()).toBeNull();

  // back after leaving and returning
  await userEvent.unhover(node);
  await userEvent.hover(node);
  expect(shown()).toBe('Save');
});

test('with hideOnPress off, a click keeps it up', async () => {
  const { node } = anchor({ text: 'Slider', hideOnPress: false });
  await userEvent.hover(node);
  await userEvent.click(node);
  expect(shown()).toBe('Slider');
});

test('tabbing to an anchor shows its tooltip', async () => {
  anchor('First', { left: 100 });
  anchor('Second', { left: 300 });
  await userEvent.tab();
  expect(shown()).toBe('First');
  await userEvent.tab();
  expect(shown()).toBe('Second');
});
