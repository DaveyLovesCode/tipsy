import { expect, test } from 'vitest';
import { configureTipsy } from '../src/index';
import type { ConfigureTipsyOptions } from '../src/index';
import { anchor, bubble, enter, frames, portal, shown, wait } from './helpers';

test('later calls merge over earlier ones', async () => {
  configureTipsy({ defaultDelay: 300 });
  configureTipsy({ position: 'bottom' });
  const { node } = anchor('Merged');
  enter(node);
  await wait(300);
  expect(shown()).toBe('Merged');
});

test('values of the wrong type are ignored, and negative durations count as 0', async () => {
  configureTipsy({ defaultDelay: '5', enabled: 0, followCursor: 'yes' } as unknown as ConfigureTipsyOptions);
  const typo = anchor('Typo', { left: 100 });
  enter(typo.node);
  await wait(899);
  expect(shown()).toBeNull();
  await wait(1);
  expect(shown()).toBe('Typo');

  configureTipsy({ defaultDelay: -100 });
  const negative = anchor('Negative', { left: 600 });
  enter(negative.node);
  expect(shown()).toBe('Negative');
});

test('kbd and modes merge entry by entry across calls', async () => {
  configureTipsy({ theme: { kbd: { background: 'rgb(1, 1, 1)' }, modes: { pro: { color: 'rgb(2, 2, 2)' } } } });
  configureTipsy({ theme: { kbd: { color: 'rgb(3, 3, 3)' }, modes: { beta: { color: 'rgb(4, 4, 4)' } } } });
  portal({ animation: { inDuration: 0, outDuration: 0 } });
  const { node } = anchor({ text: 'Pro', mode: 'pro', kbd: ['P'], delay: 0 });
  enter(node);
  await frames();
  const chip = getComputedStyle(bubble()!.querySelector('kbd')!);
  expect(chip.backgroundColor).toBe('rgb(1, 1, 1)');
  expect(chip.color).toBe('rgb(3, 3, 3)');
  expect(getComputedStyle(bubble()!).color).toBe('rgb(2, 2, 2)');
});
