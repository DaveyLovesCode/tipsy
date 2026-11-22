import { describe, expect, test, vi } from 'vitest';
import { configureTipsy, tooltipStore } from '../src/index';
import { anchor, click, enter, leave, press, settle, shown, state, wait } from './helpers';

describe('hover', () => {
  test('shows after the default 900 ms and hides 50 ms after the pointer leaves', async () => {
    const { node } = anchor('Run');
    enter(node);
    await wait(899);
    expect(shown()).toBeNull();
    await wait(1);
    expect(shown()).toBe('Run');

    leave(node);
    await wait(49);
    expect(shown()).toBe('Run');
    await wait(1);
    expect(shown()).toBeNull();
  });

  test('leaving before the delay is up shows nothing', async () => {
    const { node } = anchor('Run');
    enter(node);
    await wait(500);
    leave(node);
    await wait(2000);
    expect(shown()).toBeNull();
  });

  test('an anchor’s own delay wins, and 0 shows at once', async () => {
    const slow = anchor({ text: 'Slow', delay: 2000 }, { left: 100 });
    enter(slow.node);
    await wait(1999);
    expect(shown()).toBeNull();
    await wait(1);
    expect(shown()).toBe('Slow');
    leave(slow.node);
    await wait(1000);

    const instant = anchor({ text: 'Instant', delay: 0 }, { left: 600 });
    enter(instant.node);
    expect(shown()).toBe('Instant');
  });

  test('moving to the next anchor within 300 ms skips its delay', async () => {
    const first = anchor('First', { left: 100 });
    const second = anchor('Second', { left: 300 });
    const third = anchor('Third', { left: 500 });

    enter(first.node);
    await wait(900);
    leave(first.node, { to: second.node });
    enter(second.node);
    expect(shown()).toBe('Second');

    leave(second.node);
    await wait(50 + 301);
    enter(third.node);
    await wait(0);
    expect(shown()).toBeNull();
    await wait(900);
    expect(shown()).toBe('Third');
  });

  test('the cursor point travels with the tooltip, for followCursor', async () => {
    const { node } = anchor({ text: 'Follow', followCursor: true, delay: 0 }, { left: 100, top: 100, width: 200, height: 40 });
    enter(node);
    expect(state()).toMatchObject({ followCursor: true, cursorPoint: { x: 200, y: 120 } });
  });

  test('an interactive tooltip lingers 200 ms, long enough to reach the bubble', async () => {
    const { node } = anchor({ text: 'Help', interactive: true, delay: 0 });
    enter(node);
    leave(node);
    await wait(199);
    expect(shown()).toBe('Help');
    await wait(1);
    expect(shown()).toBeNull();
  });
});

describe('focus', () => {
  test('keyboard focus shows the tooltip and blur hides it', async () => {
    const { node } = anchor('Save');
    node.focus();
    await wait(900);
    expect(shown()).toBe('Save');
    node.blur();
    await wait(50);
    expect(shown()).toBeNull();
  });

  test('hover and focus both hold it: leaving keeps it while focused', async () => {
    const { node } = anchor({ text: 'Save', delay: 0 });
    node.focus();
    enter(node);
    leave(node);
    await wait(1000);
    expect(shown()).toBe('Save');
  });
});

describe('click', () => {
  test('toggles, and ignores hover and focus', async () => {
    const { node } = anchor({ text: 'Settings', trigger: 'click' });
    enter(node);
    node.focus();
    await wait(2000);
    expect(shown()).toBeNull();

    click(node);
    expect(shown()).toBe('Settings');
    leave(node);
    await wait(1000);
    expect(shown()).toBe('Settings');

    click(node);
    await settle();
    expect(shown()).toBeNull();
  });

  test('a press anywhere else dismisses it', async () => {
    const { node } = anchor({ text: 'Settings', trigger: 'click' });
    click(node);
    press(document.body, { focus: false });
    await settle();
    expect(shown()).toBeNull();
    // and the next click opens it again
    click(node);
    expect(shown()).toBe('Settings');
  });

  test('a click pins a hover preview, and the next click lets it go', async () => {
    const { node } = anchor({ text: 'Details', trigger: ['hover', 'click'] });
    enter(node);
    await wait(900);
    const visibility: boolean[] = [];
    const stop = tooltipStore.subscribe((current) => visibility.push(current.visible));
    click(node);
    await settle();
    stop();
    // pinning never blinks the preview off
    expect(visibility.every(Boolean)).toBe(true);

    node.blur();
    leave(node);
    await wait(1000);
    expect(shown()).toBe('Details');

    enter(node);
    click(node);
    await settle();
    expect(shown()).toBeNull();
  });
});

describe('manual and show', () => {
  test('manual binds nothing and leaves the tooltip to show', async () => {
    const { node, update } = anchor({ text: 'Invalid', trigger: 'manual', mode: 'error' });
    enter(node);
    node.focus();
    click(node);
    await wait(2000);
    expect(shown()).toBeNull();

    update({ text: 'Invalid', trigger: 'manual', mode: 'error', show: true });
    expect(state()).toMatchObject({ visible: true, text: 'Invalid', mode: 'error' });
    update({ text: 'Invalid', trigger: 'manual', mode: 'error', show: false });
    await settle();
    expect(shown()).toBeNull();
  });

  test('show: true holds the tooltip whatever the pointer does', async () => {
    const { node } = anchor({ text: 'Try this!', show: true });
    expect(shown()).toBe('Try this!');
    enter(node);
    leave(node);
    await wait(1000);
    expect(shown()).toBe('Try this!');
  });

  test('releasing show while hovered hands the tooltip back to hover', async () => {
    const { node, update } = anchor({ text: 'Hint', show: false });
    enter(node);
    await wait(2000);
    expect(shown()).toBeNull();
    update({ text: 'Hint' });
    await wait(900);
    expect(shown()).toBe('Hint');
  });
});

describe('content', () => {
  test('falsy input and blank text show nothing', async () => {
    for (const input of [null, undefined, false, '', '   ', { text: '' }] as const) {
      const { node } = anchor(input);
      enter(node);
      await wait(2000);
      expect(shown()).toBeNull();
      leave(node);
    }
  });

  test('a label that changes while showing updates in place', async () => {
    const { node, update } = anchor({ text: 'Save', delay: 0 });
    enter(node);
    let shows = 0;
    const stop = tooltipStore.subscribe((current) => current.visible && shows++);
    update({ text: 'Saving…', delay: 0, kbd: ['⌘', 'S'] });
    stop();
    expect(state()).toMatchObject({ visible: true, text: 'Saving…', kbd: ['⌘', 'S'] });
    expect(shows).toBe(2);
  });

  test('emptying the label while showing hides it at once', async () => {
    const { node, update } = anchor({ text: 'Run', delay: 0 });
    enter(node);
    update(null);
    await settle();
    expect(shown()).toBeNull();
    update({ text: 'Run', delay: 0 });
    leave(node);
    enter(node);
    expect(shown()).toBe('Run');
  });

  test('updating an anchor that isn’t showing touches nothing', async () => {
    const { update } = anchor('Idle', { left: 100 });
    const other = anchor({ text: 'Busy', delay: 0 }, { left: 600 });
    enter(other.node);
    let broadcasts = 0;
    const stop = tooltipStore.subscribe(() => broadcasts++);
    for (let i = 0; i < 20; i++) update(`Idle ${i}`);
    stop();
    expect(broadcasts).toBe(1);
    expect(shown()).toBe('Busy');
  });

  test('getRect anchors the bubble to a rect of its choosing', () => {
    const icon = { left: 10, top: 20, right: 30, bottom: 40, width: 20, height: 20 };
    const { node } = anchor({ text: 'Edit', delay: 0, getRect: () => icon });
    enter(node);
    expect(state().anchorRect).toEqual(icon);
    expect(state().getAnchorRect?.()).toEqual(icon);
  });
});

describe('position', () => {
  test('falls back to the container’s data-tooltip-position, then the global default', () => {
    const nav = document.createElement('nav');
    nav.dataset.tooltipPosition = 'bottom';
    document.body.append(nav);
    const inherits = anchor({ text: 'Back', delay: 0 }, { parent: nav, left: 100 });
    const own = anchor({ text: 'Forward', delay: 0, position: 'left' }, { parent: nav, left: 300 });
    configureTipsy({ position: 'right' });
    const global = anchor({ text: 'Home', delay: 0 }, { left: 500 });

    enter(inherits.node);
    expect(state().position).toBe('bottom');
    enter(own.node);
    expect(state().position).toBe('left');
    enter(global.node);
    expect(state().position).toBe('right');
  });
});

describe('triggers that change', () => {
  test('losing hover while showing hides at once; gaining click works right away', async () => {
    const { node, update } = anchor({ text: 'Mode', delay: 0 });
    enter(node);
    update({ text: 'Mode', delay: 0, trigger: 'click' });
    await settle();
    expect(shown()).toBeNull();
    click(node);
    expect(shown()).toBe('Mode');
  });

  test('a global trigger applies to anchors mounted after it', async () => {
    configureTipsy({ trigger: 'click' });
    const { node } = anchor({ text: 'Later', delay: 0 });
    enter(node);
    expect(shown()).toBeNull();
    click(node);
    expect(shown()).toBe('Later');
  });
});

describe('dismissing', () => {
  async function showing() {
    const target = anchor({ text: 'Up', delay: 0 });
    enter(target.node);
    expect(shown()).toBe('Up');
    return target;
  }

  test('the window losing focus dismisses it', async () => {
    await showing();
    window.dispatchEvent(new Event('blur'));
    await settle();
    expect(shown()).toBeNull();
  });

  test('the tab being hidden dismisses it', async () => {
    await showing();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete (document as { visibilityState?: string }).visibilityState;
    await settle();
    expect(shown()).toBeNull();
  });

  test('the pointer leaving the page dismisses it, and the next one waits its full delay', async () => {
    const { node } = await showing();
    leave(node, { to: null });
    await settle();
    expect(shown()).toBeNull();
    const next = anchor('Next', { left: 100 });
    enter(next.node);
    await wait(0);
    expect(shown()).toBeNull();
  });

  test('a press elsewhere cancels a tooltip still waiting to show', async () => {
    const { node } = anchor('Pending');
    enter(node);
    await wait(500);
    press(document.body, { focus: false });
    await wait(2000);
    expect(shown()).toBeNull();
  });

  test('a press inside an interactive bubble leaves it up', async () => {
    const { node } = anchor({ text: 'Link', interactive: true, delay: 0 });
    enter(node);
    const bubble = Object.assign(document.createElement('div'), { id: 'tipsy-bubble' });
    document.body.append(bubble);
    press(bubble, { focus: false });
    await settle();
    expect(shown()).toBe('Link');
  });

  test('turning tooltips off suppresses every one until they are back on', async () => {
    configureTipsy({ enabled: false });
    const { node } = anchor({ text: 'Quiet', delay: 0 });
    enter(node);
    node.focus();
    expect(shown()).toBeNull();
    configureTipsy({ enabled: true });
    leave(node);
    enter(node);
    expect(shown()).toBe('Quiet');
  });

  test('a zero default delay can mean off, while an anchor’s own delay: 0 still shows', async () => {
    let delay = 0;
    configureTipsy({ getDelay: () => delay, disableWhenDefaultDelayIsZero: true });
    const regular = anchor('Regular', { left: 100 });
    const hint = anchor({ text: 'Hint', delay: 0 }, { left: 600 });
    enter(regular.node);
    await wait(2000);
    expect(shown()).toBeNull();
    leave(regular.node);
    enter(hint.node);
    expect(shown()).toBe('Hint');
    leave(hint.node);
    await wait(1000);

    // the delay is read on every show
    delay = 400;
    enter(regular.node);
    await wait(399);
    expect(shown()).toBeNull();
    await wait(1);
    expect(shown()).toBe('Regular');
  });
});

describe('accessibility', () => {
  test('aria-describedby points at the bubble while it shows, beside the anchor’s own ids', async () => {
    const { node } = anchor({ text: 'Save', delay: 0 });
    node.setAttribute('aria-describedby', 'hint');
    const plain = anchor({ text: 'Plain', delay: 0 }, { left: 100 });

    enter(node);
    expect(node.getAttribute('aria-describedby')).toBe('hint tipsy-bubble');
    leave(node, { to: plain.node });
    enter(plain.node);
    await settle();
    expect(node.getAttribute('aria-describedby')).toBe('hint');
    expect(plain.node.getAttribute('aria-describedby')).toBe('tipsy-bubble');
    leave(plain.node);
    await wait(50);
    expect(plain.node.hasAttribute('aria-describedby')).toBe(false);
  });

  test('an id the app changes while the tooltip shows survives the hide', async () => {
    const { node } = anchor({ text: 'Email', delay: 0 });
    node.setAttribute('aria-describedby', 'old-hint');
    enter(node);
    node.setAttribute('aria-describedby', 'new-hint tipsy-bubble');
    leave(node);
    await wait(50);
    expect(node.getAttribute('aria-describedby')).toBe('new-hint');
  });
});

describe('lifecycle', () => {
  test('destroying a showing anchor hides it, and its events go quiet', async () => {
    const { node, destroy } = anchor({ text: 'Gone', delay: 0 });
    enter(node);
    destroy();
    await settle();
    expect(shown()).toBeNull();
    expect(node.hasAttribute('aria-describedby')).toBe(false);
    leave(node);
    enter(node);
    node.focus();
    await wait(2000);
    expect(shown()).toBeNull();
  });

  test('destroying an anchor cancels its pending show', async () => {
    const { node, destroy } = anchor('Pending');
    enter(node);
    await wait(500);
    destroy();
    await wait(2000);
    expect(shown()).toBeNull();
  });
});

describe('touch screens', () => {
  test('hover and focus bind nothing, and click still works', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(hover: none)' }));
    const hover = anchor({ text: 'Hover', delay: 0 }, { left: 100 });
    enter(hover.node);
    hover.node.focus();
    expect(shown()).toBeNull();

    const tap = anchor({ text: 'Tap', trigger: 'click' }, { left: 600 });
    click(tap.node);
    expect(shown()).toBe('Tap');
  });
});
