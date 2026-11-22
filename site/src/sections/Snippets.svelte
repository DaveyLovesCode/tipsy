<script lang="ts">
  import { tooltip } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Code from '../lib/Code.svelte';
  import { pointVerb } from '../lib/pointer';

  let { id, label }: { id: string; label: string } = $props();

  let count = $state(3);

  const code = `<script lang="ts">
  import { tooltip } from 'tipsy';
  let count = $state(3);
<\/script>

{#snippet summary()}
  <div class="rich">
    <strong>{count} pending changes</strong>
    <span class="rich-sub">Run review before committing.</span>
  </div>
{/snippet}

<div use:tooltip={{ content: summary, hideOnPress: false }}>
  <button onclick={() => count--}>−</button>
  {count}
  <button onclick={() => count++}>+</button>
</div>`;
</script>

<Section {id} {label} title="Put any Svelte snippet in the bubble.">
  {#snippet intro()}
    <p>
      Pass a snippet as <code>content</code>. It keeps the reactive scope of the component that
      declares it, so the bubble changes when your state does, without animating in again.
    </p>
    <p>
      The snippet renders in the portal, outside your component, so style its markup with global
      CSS.
    </p>
  {/snippet}

  <div class="layout">
    {#snippet summary()}
      <div class="rich">
        <strong>{count} pending changes</strong>
        <span class="rich-sub">Run review before committing.</span>
      </div>
    {/snippet}

    <div class="stage panel live">
      <div class="stepper" use:tooltip={{ content: summary, hideOnPress: false }}>
        <button class="step" onclick={() => (count = Math.max(0, count - 1))} aria-label="Decrement">−</button>
        <span class="counter">{count}</span>
        <button class="step" onclick={() => count++} aria-label="Increment">+</button>
      </div>
      <p class="hint">{pointVerb} the counter, then press + or −. The number in the bubble follows.</p>
    </div>

    <Code {code} />
  </div>
</Section>

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) minmax(0, max-content);
    gap: 16px;
  }

  @media (max-width: 800px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 40px 24px;
    text-align: center;
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    padding: 4px;
    border: 1px solid var(--line-hi);
    border-radius: var(--r);
    background: var(--bg);
  }

  .step {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-sm);
    color: var(--ink-soft);
    font-size: 17px;
    line-height: 1;
    transition:
      background 120ms ease,
      color 120ms ease;
  }
  .step:hover {
    color: var(--ink);
    background: var(--bg-hover);
  }

  .counter {
    min-width: 48px;
    font-size: 20px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: center;
    letter-spacing: -0.02em;
  }
</style>
