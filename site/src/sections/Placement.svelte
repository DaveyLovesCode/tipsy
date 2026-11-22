<script lang="ts">
  import { tooltip } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Code from '../lib/Code.svelte';

  let { id, label }: { id: string; label: string } = $props();

  let stage = $state<HTMLDivElement | null>(null);
  let pos = $state({ x: 0.5, y: 0.5 }); // 0..1 within stage
  let dragging = $state(false);

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    move(e);
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    move(e);
  }
  function onPointerUp(e: PointerEvent) {
    dragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function move(e: PointerEvent) {
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    pos = {
      x: clamp((e.clientX - r.left) / r.width, 0, 1),
      y: clamp((e.clientY - r.top) / r.height, 0, 1),
    };
  }

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  const code = `<div data-tooltip-boundary="placement-demo">
  <button
    use:tooltip={{
      text: 'I stay in the box',
      position: 'top',
      boundarySelector: '[data-tooltip-boundary="placement-demo"]',
      hideOnPress: false,
    }}
  >
    drag
  </button>
</div>`;
</script>

<Section {id} {label} title="The bubble goes on the side that has room.">
  {#snippet intro()}
    <p>
      <code>position</code> is the side you would like. When the bubble does not fit there, Tipsy
      scores all four sides by the space they have and uses the best one.
    </p>
    <p>
      Give it a <code>boundarySelector</code> and the bubble stays inside that element. Without
      one, the boundary is the viewport.
    </p>
  {/snippet}

  <div class="grid">
    <div class="col panel">
      <h3>Four sides</h3>
      <p class="hint">Each button asks for one side, and gets it when that side has room.</p>
      <div class="four">
        <div></div>
        <button class="demo-btn" use:tooltip={{ text: 'position: top', position: 'top' }}>top</button>
        <div></div>

        <button class="demo-btn" use:tooltip={{ text: 'position: left', position: 'left' }}>left</button>
        <div></div>
        <button class="demo-btn" use:tooltip={{ text: 'position: right', position: 'right' }}>right</button>

        <div></div>
        <button class="demo-btn" use:tooltip={{ text: 'position: bottom', position: 'bottom' }}>bottom</button>
        <div></div>
      </div>
    </div>

    <div class="col panel">
      <h3>Inside a boundary</h3>
      <p class="hint">
        Drag the handle to an edge. The bubble asks for the top and changes sides to stay in the box.
      </p>

      <div
        class="stage"
        bind:this={stage}
        data-tooltip-boundary="placement-demo"
      >
        <div
          class="anchor"
          role="slider"
          tabindex="0"
          aria-label="Draggable anchor"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(pos.x * 100)}
          style="--x: {pos.x * 100}%; --y: {pos.y * 100}%;"
          onpointerdown={onPointerDown}
          onpointermove={onPointerMove}
          onpointerup={onPointerUp}
          use:tooltip={{
            text: 'I stay in the box',
            position: 'top',
            boundarySelector: '[data-tooltip-boundary="placement-demo"]',
            hideOnPress: false,
          }}
        >
          drag
        </div>
      </div>
    </div>
  </div>

  <p class="hint note">
    Pressing an anchor normally puts its tooltip away. The handle sets
    <code>hideOnPress: false</code>, so its tooltip stays up through the drag.
  </p>

  <Code {code} />
</Section>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 880px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  h3 {
    font-size: 15px;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }

  .col {
    display: flex;
    flex-direction: column;
    padding: 22px;
  }

  .col .hint {
    margin-bottom: 20px;
  }

  .four {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: 12px;
    place-content: center;
    place-items: center;
    min-height: 200px;
  }

  .stage {
    position: relative;
    height: 240px;
    background-color: var(--bg-sunken);
    background-image:
      linear-gradient(var(--line) 1px, transparent 1px),
      linear-gradient(90deg, var(--line) 1px, transparent 1px);
    background-size: 24px 24px;
    background-position: -1px -1px;
    border: 1px solid var(--line-hi);
    border-radius: var(--r-sm);
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }

  .anchor {
    --size: 52px;
    position: absolute;
    /* The handle follows the pointer and stops where its edge meets the box's. */
    left: clamp(var(--size) / 2, var(--x), 100% - var(--size) / 2);
    top: clamp(var(--size) / 2, var(--y), 100% - var(--size) / 2);
    transform: translate(-50%, -50%);
    width: var(--size);
    height: var(--size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: var(--accent-ink);
    border-radius: 50%;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    cursor: grab;
    transition: transform 120ms ease;
  }
  .anchor:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(0.94);
  }

  .note {
    margin-block: 16px;
  }
</style>
