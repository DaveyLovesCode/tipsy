import { describe, expect, test } from 'vitest';
import {
  cancelPendingHide,
  configureTipsy,
  dismissTooltip,
  forceHideTooltip,
  hideTooltip,
  isWarm,
  showTooltip,
  tooltipStore,
  updateVisibleTooltip,
} from '../src/index';
import { settle, shown, state, wait } from './helpers';

const rect = { left: 100, top: 100, right: 140, bottom: 120, width: 40, height: 20 };

describe('showing', () => {
  test('a canvas hit shows a tooltip anchored to any rect', () => {
    showTooltip({ text: 'Cell A1', position: 'bottom', ownerId: 7 }, rect);
    expect(state()).toMatchObject({ visible: true, text: 'Cell A1', position: 'bottom', ownerId: 7, anchorRect: rect });
  });

  test('a new show replaces the last one whole, so nothing carries over', () => {
    showTooltip({ text: 'First', mode: 'error', kbd: ['F'], interactive: true }, rect);
    showTooltip({ text: 'Second' }, rect);
    expect(state()).toMatchObject({ text: 'Second', mode: 'default', kbd: null, interactive: false });
  });

  test('an empty kbd list shows no chips', () => {
    showTooltip({ text: 'Save', kbd: [] }, rect);
    expect(state().kbd).toBeNull();
  });
});

describe('hiding', () => {
  test('hideTooltip waits out hideDelay, or the delay it is given', async () => {
    showTooltip({ text: 'Bye' }, rect);
    hideTooltip();
    await wait(49);
    expect(shown()).toBe('Bye');
    await wait(1);
    expect(shown()).toBeNull();

    showTooltip({ text: 'Slow' }, rect);
    hideTooltip(undefined, 500);
    await wait(499);
    expect(shown()).toBe('Slow');
    await wait(1);
    expect(shown()).toBeNull();
  });

  test('cancelPendingHide keeps the tooltip up', async () => {
    showTooltip({ text: 'Stay' }, rect);
    hideTooltip();
    cancelPendingHide();
    await wait(1000);
    expect(shown()).toBe('Stay');
  });

  test('forceHideTooltip hides without the grace period', async () => {
    showTooltip({ text: 'Now' }, rect);
    forceHideTooltip();
    await settle();
    expect(shown()).toBeNull();
  });

  test('a hide naming another owner leaves the tooltip alone', async () => {
    showTooltip({ text: 'Mine', ownerId: 1 }, rect);
    hideTooltip(2);
    forceHideTooltip(2);
    await wait(1000);
    expect(shown()).toBe('Mine');
    forceHideTooltip(1);
    await settle();
    expect(shown()).toBeNull();
  });
});

describe('the warm cursor', () => {
  test('is warm while a tooltip shows and for warmThreshold after it hides', async () => {
    expect(isWarm()).toBe(false);
    showTooltip({ text: 'A' }, rect);
    expect(isWarm()).toBe(true);
    forceHideTooltip();
    await settle();
    await wait(299);
    expect(isWarm()).toBe(true);
    await wait(1);
    expect(isWarm()).toBe(false);
  });

  test('warmThreshold is configurable', async () => {
    configureTipsy({ warmThreshold: 1000 });
    showTooltip({ text: 'A' }, rect);
    forceHideTooltip();
    await wait(999);
    expect(isWarm()).toBe(true);
  });

  test('dismissTooltip forgets the warm state at once', async () => {
    showTooltip({ text: 'A' }, rect);
    dismissTooltip();
    await settle();
    expect(shown()).toBeNull();
    expect(isWarm()).toBe(false);
    expect(state().ownerId).toBeNull();
  });
});

describe('updating in place', () => {
  test('changes the visible tooltip without showing it again', () => {
    showTooltip({ text: 'Saving…', ownerId: 3 }, rect);
    let shows = 0;
    const stop = tooltipStore.subscribe((current) => current.visible && shows++);
    updateVisibleTooltip({ text: 'Saved', kbd: ['⌘', 'S'] }, 3);
    stop();
    expect(state()).toMatchObject({ visible: true, text: 'Saved', kbd: ['⌘', 'S'] });
    expect(shows).toBe(2);
  });

  test('leaves a hidden tooltip, and another owner’s, untouched', async () => {
    showTooltip({ text: 'Mine', ownerId: 1 }, rect);
    updateVisibleTooltip({ text: 'Theirs' }, 2);
    expect(shown()).toBe('Mine');
    forceHideTooltip();
    await settle();
    updateVisibleTooltip({ text: 'Ghost' });
    expect(state()).toMatchObject({ visible: false, text: 'Mine' });
  });

  test('an empty kbd list clears the chips, and omitted fields stay', () => {
    showTooltip({ text: 'Save', kbd: ['S'], mode: 'warning' }, rect);
    updateVisibleTooltip({ kbd: [] });
    expect(state()).toMatchObject({ kbd: null, mode: 'warning', text: 'Save' });
  });
});
