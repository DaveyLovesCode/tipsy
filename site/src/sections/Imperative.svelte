<script lang="ts">
  import { showTooltip, hideTooltip } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Code from '../lib/Code.svelte';
  import { hovers } from '../lib/pointer';
  import { theme } from '../lib/theme.svelte';

  let { id, label }: { id: string; label: string } = $props();

  let canvas = $state<HTMLCanvasElement | null>(null);

  const COLS = 24;
  const ROWS = 8;

  let hovered = $state<{ x: number; y: number } | null>(null);

  /** A cell's value, 0 to 1, rising toward the bottom right. */
  function cellValue(x: number, y: number): number {
    return (x / (COLS - 1) + y / (ROWS - 1)) / 2;
  }

  // Redrawn on hover, and when the theme changes the dot color.
  $effect(() => {
    void theme.mode;
    void hovered;
    draw();
  });

  function draw() {
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cellW = w / COLS;
    const cellH = h / ROWS;

    const style = getComputedStyle(canvas);
    const dotRgb = style.getPropertyValue('--dot-rgb');
    const accent = style.getPropertyValue('--accent');

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cx = (x + 0.5) * cellW;
        const cy = (y + 0.5) * cellH;
        const t = cellValue(x, y);
        const isHovered = hovered && hovered.x === x && hovered.y === y;
        ctx.beginPath();
        ctx.arc(cx, cy, isHovered ? 6 : 1 + t * 4, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? accent : `rgb(${dotRgb} / ${0.14 + t * 0.4})`;
        ctx.fill();
      }
    }
  }

  function showCell(e: MouseEvent) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cellW = rect.width / COLS;
    const cellH = rect.height / ROWS;
    const x = Math.floor((e.clientX - rect.left) / cellW);
    const y = Math.floor((e.clientY - rect.top) / cellH);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    // Moving within a cell changes nothing. A tap always shows, since the last one may have been dismissed.
    if (hovers && hovered?.x === x && hovered?.y === y) return;
    hovered = { x, y };

    // Anchor the bubble to the cell, not the cursor.
    const cellLeft = rect.left + x * cellW;
    const cellTop = rect.top + y * cellH;
    showTooltip(
      {
        text: `cell (${x}, ${y})`,
        kbd: [`v=${(cellValue(x, y) * 100).toFixed(0)}`],
        position: 'top',
      },
      {
        left: cellLeft,
        right: cellLeft + cellW,
        top: cellTop,
        bottom: cellTop + cellH,
        width: cellW,
        height: cellH,
      },
    );
  }

  function onMouseLeave() {
    hovered = null;
    hideTooltip();
  }

  const code = `import { showTooltip, hideTooltip } from 'tipsy';

function onMouseMove(e: MouseEvent) {
  const cell = pickCell(e);
  if (!cell) return;
  showTooltip(
    { text: \`cell (\${cell.x}, \${cell.y})\`, position: 'top' },
    cell.rect,
  );
}

<canvas onmousemove={onMouseMove} onmouseleave={() => hideTooltip()}></canvas>`;
</script>

<Section {id} {label} title="Tooltips for things that are not elements.">
  {#snippet intro()}
    <p>
      <code>showTooltip(options, rect)</code> shows the bubble at any rectangle: a canvas cell, a
      row in a virtual list, an SVG shape. <code>hideTooltip()</code> hides it, and
      <code>updateVisibleTooltip</code> changes what is showing without animating it in again.
    </p>
  {/snippet}

  <div class="frame panel">
    <!-- A tap's mousemove comes before its press, which dismisses, so a touch screen shows the cell on click. -->
    <canvas
      bind:this={canvas}
      onmousemove={hovers ? showCell : undefined}
      onclick={hovers ? undefined : showCell}
      onmouseleave={onMouseLeave}
      aria-label="Hoverable canvas grid"
    ></canvas>
    <p class="hint">
      {hovers ? 'Move the pointer over the grid.' : 'Tap the grid.'} All 192 dots are drawn on one
      canvas, and each gets its own tooltip.
    </p>
  </div>

  <Code {code} lang="ts" />
</Section>

<style>
  .frame {
    padding: 16px;
    margin-bottom: 16px;
  }

  canvas {
    display: block;
    width: 100%;
    height: 240px;
    border-radius: var(--r-sm);
    background: var(--bg-sunken);
    border: 1px solid var(--line);
  }

  .frame .hint {
    margin-top: 12px;
    text-align: center;
  }
</style>
