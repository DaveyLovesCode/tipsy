<script lang="ts">
  import { tooltip, configureTipsy } from 'tipsy';
  import type { EasingPreset } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Code from '../lib/Code.svelte';
  import Slider from '../lib/Slider.svelte';
  import { pointVerb } from '../lib/pointer';
  import { tooltipAnimation } from '../lib/theme.svelte';

  let { id, label }: { id: string; label: string } = $props();

  let inDuration = $state(tooltipAnimation.inDuration);
  let outDuration = $state(tooltipAnimation.outDuration);
  let distance = $state(tooltipAnimation.distance);
  let scale = $state(tooltipAnimation.scale);
  let easing = $state<EasingPreset>(tooltipAnimation.easing);
  let moveDuration = $state(tooltipAnimation.moveDuration);

  $effect(() => configureTipsy({ animation: { inDuration, outDuration, distance, scale, easing, moveDuration } }));

  const easings: EasingPreset[] = ['cubic-out', 'cubic-in', 'cubic-in-out', 'linear'];

  const code = $derived(`configureTipsy({
  animation: {
    inDuration: ${inDuration},
    outDuration: ${outDuration},
    distance: ${distance},
    scale: ${scale},
    easing: '${easing}',
    moveDuration: ${moveDuration},
  },
});`);
</script>

<Section {id} {label} title="Set how the bubble appears.">
  {#snippet intro()}
    <p>
      Six settings: how long the reveal and the hide take, how far the bubble slides, the scale it
      starts at, the easing, and how long the bubble takes to travel to the next anchor.
      <code>distance: 0</code> with <code>scale: 1</code> is a plain fade, <code>moveDuration: 0</code>
      jumps, and <code>easing</code> also takes your own function.
    </p>
    <p>
      This page sets <code>defaultDelay: 0</code>, so its tooltips show at once. The default is
      900 ms, and a tooltip that follows another within 300 ms skips the wait.
    </p>
  {/snippet}

  <div class="grid">
    <div class="controls panel">
      <label class="ctrl">
        <span class="ctrl-head">
          <span>Reveal duration</span>
          <span class="value">{inDuration} ms</span>
        </span>
        <Slider bind:value={inDuration} min={0} max={500} aria-label="Reveal duration" />
      </label>

      <label class="ctrl">
        <span class="ctrl-head">
          <span>Hide duration</span>
          <span class="value">{outDuration} ms</span>
        </span>
        <Slider bind:value={outDuration} min={0} max={500} aria-label="Hide duration" />
      </label>

      <label class="ctrl">
        <span class="ctrl-head">
          <span>Slide distance</span>
          <span class="value">{distance} px</span>
        </span>
        <Slider bind:value={distance} min={0} max={20} aria-label="Slide distance" />
      </label>

      <label class="ctrl">
        <span class="ctrl-head">
          <span>Start scale</span>
          <span class="value">{scale.toFixed(2)}</span>
        </span>
        <Slider bind:value={scale} min={0.5} max={1} step={0.01} aria-label="Start scale" />
      </label>

      <label class="ctrl">
        <span class="ctrl-head">
          <span>Move duration</span>
          <span class="value">{moveDuration} ms</span>
        </span>
        <Slider bind:value={moveDuration} min={0} max={600} aria-label="Move duration" />
      </label>

      <div class="ctrl">
        <span class="ctrl-head">
          <span>Easing</span>
        </span>
        <div class="chips">
          {#each easings as e (e)}
            <button class="chip" class:active={easing === e} onclick={() => (easing = e)}>{e}</button>
          {/each}
        </div>
      </div>
    </div>

    <div class="stage panel live">
      <div class="buttons">
        <button class="demo-btn" data-tone="accent" use:tooltip={'Animated with these settings'}>
          {pointVerb} me
        </button>
        <button class="demo-btn" use:tooltip={{ text: 'Same settings', kbd: ['↵'] }}>Then me</button>
      </div>
      <p class="hint">Move a slider, then go from one button to the other.</p>
    </div>
  </div>

  <Code {code} lang="ts" />
</Section>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  @media (max-width: 880px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  .controls {
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .ctrl {
    display: flex;
    flex-direction: column;
  }

  .ctrl-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
    color: var(--ink-soft);
    font-weight: 500;
  }

  .value {
    font-family: var(--font-mono);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    height: 28px;
    padding: 0 10px;
    border-radius: var(--r-sm);
    border: 1px solid var(--line-hi);
    background: var(--bg);
    color: var(--ink-mute);
    font-family: var(--font-mono);
    font-size: 12px;
    transition:
      color 120ms ease,
      border-color 120ms ease;
  }
  .chip:hover {
    color: var(--ink);
  }
  .chip.active {
    border-color: var(--accent);
    color: var(--ink);
  }

  .stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 36px 24px;
    text-align: center;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
</style>
