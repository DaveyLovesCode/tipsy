import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import { configureTipsy, showTooltip } from '../src/index';
import type { TooltipInput } from '../src/index';
import { anchor, bubble, enter, frames, leave, portal, shown, wait } from './helpers';

const instant = { inDuration: 0, outDuration: 0, moveDuration: 0 };

/** Shows `input` on an anchor and waits for the bubble to be placed. */
async function showing(input: TooltipInput, at: Parameters<typeof anchor>[1] = {}) {
  const target = anchor(typeof input === 'string' ? { text: input, delay: 0 } : { delay: 0, ...input }, at);
  enter(target.node);
  await frames();
  expect(bubble(), 'bubble on screen').not.toBeNull();
  return { ...target, bubble: bubble()!, rect: bubble()!.getBoundingClientRect(), anchorRect: target.node.getBoundingClientRect() };
}

function near(actual: number, expected: number) {
  expect(Math.abs(actual - expected), `${actual} ≈ ${expected}`).toBeLessThanOrEqual(1);
}

describe('rendering', () => {
  test('the bubble is a tooltip with the text and every chip, repeated ones included', async () => {
    portal({ animation: instant });
    const { bubble } = await showing({ text: 'Undo', kbd: ['⌘', '⌘', 'Z'] });
    expect(bubble.getAttribute('role')).toBe('tooltip');
    expect(bubble.querySelector('.tipsy-text')?.textContent).toBe('Undo');
    expect([...bubble.querySelectorAll('kbd')].map((chip) => chip.textContent)).toEqual(['⌘', '⌘', 'Z']);
  });

  test('a snippet renders in place of the text', async () => {
    portal({ animation: instant });
    const content = createRawSnippet(() => ({ render: () => '<strong class="rich">3 warnings</strong>' }));
    const { bubble } = await showing({ content, kbd: ['W'] });
    expect(bubble.querySelector('.rich')?.textContent).toBe('3 warnings');
    expect(bubble.querySelector('.tipsy-text')).toBeNull();
    expect(bubble.querySelectorAll('kbd')).toHaveLength(1);
  });

  test('it leaves the page once the tooltip hides, and nothing renders while none shows', async () => {
    portal({ animation: instant });
    expect(document.querySelector('.tipsy-tooltip')).toBeNull();
    const { node } = await showing('Bye');
    leave(node);
    await wait(50);
    await frames(3);
    expect(document.querySelector('.tipsy-tooltip')).toBeNull();
  });
});

describe('placement on screen', () => {
  test('centered `gap` above its anchor', async () => {
    portal({ animation: instant });
    const { rect, anchorRect } = await showing('Centered');
    near(rect.bottom, anchorRect.top - 10);
    near(rect.left + rect.width / 2, anchorRect.left + anchorRect.width / 2);
    expect(bubble()!.dataset.position).toBe('top');
  });

  test('the global gap and edgePadding apply', async () => {
    configureTipsy({ gap: 24, edgePadding: 30 });
    portal({ animation: instant });
    const { rect, anchorRect } = await showing('Spaced', { left: 0, top: 300, width: 20 });
    near(rect.bottom, anchorRect.top - 24);
    near(rect.left, 30);
  });

  test('an anchor at the top flips it below; one at the right edge keeps it on screen', async () => {
    portal({ animation: instant });
    const top = await showing('Below', { left: 400, top: 0 });
    expect(bubble()!.dataset.position).toBe('bottom');
    near(top.rect.top, top.anchorRect.bottom + 10);
    leave(top.node);

    const edge = await showing('A label near the right edge', { left: 960, top: 300, width: 40 });
    near(edge.rect.right, window.innerWidth - 6);
  });

  test('it follows an anchor that moves, and hides once the anchor leaves the viewport', async () => {
    portal({ animation: instant });
    const { node, rect } = await showing('Follow');
    node.style.left = '600px';
    await frames();
    near(bubble()!.getBoundingClientRect().left, rect.left + 200);
    node.style.left = '-500px';
    await frames();
    expect(shown()).toBeNull();
  });

  test('a boundary keeps it inside, and the anchor leaving the boundary hides it', async () => {
    const panel = document.createElement('div');
    panel.id = 'panel';
    Object.assign(panel.style, { position: 'fixed', left: '300px', top: '200px', width: '300px', height: '300px' });
    document.body.append(panel);
    portal({ animation: instant, boundarySelector: '#panel' });

    const { node, rect } = await showing('Inside the panel, far from the viewport edge', { left: 300, top: 300, width: 30 });
    near(rect.left, 306);
    node.style.left = '700px';
    await frames();
    expect(shown()).toBeNull();
  });

  test('a virtual anchor is read every frame through getAnchorRect', async () => {
    portal({ animation: instant });
    let left = 100;
    const rect = () => ({ left, right: left + 40, top: 300, bottom: 320, width: 40, height: 20 });
    showTooltip({ text: 'Cell', getAnchorRect: rect }, rect());
    await frames();
    const before = bubble()!.getBoundingClientRect().left;
    left = 500;
    await frames();
    near(bubble()!.getBoundingClientRect().left, before + 400);
  });
});

describe('width and wrapping', () => {
  const long = 'This label is long enough that it has to wrap onto a second line';

  test('long text wraps within maxWidth, and short text stays on one line', async () => {
    portal({ animation: instant });
    const wrapped = await showing(long);
    expect(wrapped.bubble.classList).toContain('tipsy-multiline');
    expect(wrapped.rect.width).toBeLessThanOrEqual(280);
    leave(wrapped.node);
    await wait(50);

    const short = await showing('Short', { left: 100 });
    expect(short.bubble.classList).not.toContain('tipsy-multiline');
  });

  test('an anchor’s maxWidth beats the portal’s, which beats the global one', async () => {
    configureTipsy({ maxWidth: 260 });
    portal({ animation: instant, maxWidth: 200 });
    const fromPortal = await showing(long);
    expect(fromPortal.rect.width).toBeLessThanOrEqual(200);
    expect(fromPortal.rect.width).toBeGreaterThan(150);
    leave(fromPortal.node);
    await wait(50);

    const own = await showing({ text: long, maxWidth: 120 }, { left: 100 });
    expect(own.rect.width).toBeLessThanOrEqual(120);
  });

  test('maxWidth and wrapAt set after the portal mounted still apply', async () => {
    portal({ animation: instant });
    configureTipsy({ maxWidth: 120, wrapAt: 4 });
    const { rect, bubble } = await showing('Wraps now');
    expect(bubble.classList).toContain('tipsy-multiline');
    expect(rect.width).toBeLessThanOrEqual(120);
  });
});

describe('looks', () => {
  test('theme numbers are pixels, and the portal’s theme wins over the global one', async () => {
    configureTipsy({ theme: { radius: 2, color: 'rgb(0, 0, 255)', background: 'rgb(10, 10, 10)' } });
    portal({ animation: instant, theme: { radius: 9, fontSize: 15, background: 'rgb(200, 0, 0)' } });
    const style = getComputedStyle((await showing('Themed')).bubble);
    expect(style.borderRadius).toBe('9px');
    expect(style.fontSize).toBe('15px');
    expect(style.backgroundColor).toBe('rgb(200, 0, 0)');
    expect(style.color).toBe('rgb(0, 0, 255)');
  });

  test('modes recolor the bubble: the built-in error and your own', async () => {
    configureTipsy({ theme: { modes: { pro: { background: 'rgb(99, 102, 241)', color: 'rgb(255, 255, 255)' } } } });
    portal({ animation: instant });
    const error = await showing({ text: 'Required', mode: 'error' });
    expect(error.bubble.dataset.mode).toBe('error');
    expect(getComputedStyle(error.bubble).backgroundColor).toBe('rgba(127, 29, 29, 0.98)');
    leave(error.node);
    await wait(50);

    const pro = await showing({ text: 'Pro feature', mode: 'pro' }, { left: 100 });
    expect(getComputedStyle(pro.bubble).backgroundColor).toBe('rgb(99, 102, 241)');
  });

  test('the class and style props reach the bubble, CSS variables included', async () => {
    portal({ animation: instant, class: 'mine', style: '--tipsy-bg: rgb(1, 2, 3);' });
    const { bubble } = await showing('Styled');
    expect(bubble.classList).toContain('mine');
    expect(getComputedStyle(bubble).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  test('theme changes reach a portal that is already showing', async () => {
    portal({ animation: instant });
    const { bubble } = await showing('Live');
    configureTipsy({ theme: { background: 'rgb(0, 128, 0)' } });
    await frames();
    expect(getComputedStyle(bubble).backgroundColor).toBe('rgb(0, 128, 0)');
  });
});

describe('interactive bubbles', () => {
  test('take the pointer, stay up while it is inside, and hide once it leaves', async () => {
    portal({ animation: instant });
    const { node, bubble } = await showing({ text: 'Read the docs', interactive: true });
    expect(getComputedStyle(bubble).pointerEvents).toBe('auto');

    leave(node, { to: bubble });
    await wait(100);
    bubble.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(1000);
    expect(shown()).toBe('Read the docs');

    bubble.dispatchEvent(new MouseEvent('mouseleave'));
    await wait(50);
    expect(shown()).toBeNull();
  });

  test('a plain bubble lets the pointer through', async () => {
    portal({ animation: instant });
    const { bubble } = await showing('Plain');
    expect(getComputedStyle(bubble).pointerEvents).toBe('none');
  });
});
