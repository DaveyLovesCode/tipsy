<script lang="ts">
  import { tooltip } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Demo from '../lib/Demo.svelte';
  import { pointVerb } from '../lib/pointer';

  let { id, label }: { id: string; label: string } = $props();

  const code = `{#snippet helpTip()}
  <div class="rich">
    <span>Need help with placement?</span>
    <a class="link" href="/docs/placement">Read the docs →</a>
  </div>
{/snippet}

<button use:tooltip={{ content: helpTip, interactive: true }}>
  Help
</button>`;
</script>

{#snippet helpTip()}
  <div class="rich">
    <span>Need help with placement?</span>
    <a class="link" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noreferrer">
      Read the docs →
    </a>
  </div>
{/snippet}

<Section {id} {label} title="Let the cursor move into the bubble.">
  {#snippet intro()}
    <p>
      A tooltip normally ignores the pointer. With <code>interactive: true</code> the bubble takes
      pointer events and waits 200 ms before it hides, which is enough time to cross the gap from
      the anchor. Use it for a link or a button inside the tooltip.
    </p>
  {/snippet}

  <Demo {code}>
    <div class="col">
      <button class="demo-btn" use:tooltip={{ content: helpTip, interactive: true }}>Help</button>
      <p class="hint">{pointVerb} the button, then click the link in the bubble.</p>
    </div>
  </Demo>
</Section>

<style>
  .col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    text-align: center;
  }
</style>
