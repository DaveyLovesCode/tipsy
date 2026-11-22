<script lang="ts">
  import { tooltip, configureTipsy } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Code from '../lib/Code.svelte';

  let { id, label }: { id: string; label: string } = $props();

  configureTipsy({
    theme: {
      modes: {
        success: {
          background: 'rgb(20 83 45 / 0.98)',
          border: 'rgb(34 197 94 / 0.55)',
          color: 'rgb(220 252 231)',
        },
      },
    },
  });

  const code = `configureTipsy({
  theme: {
    modes: {
      success: {
        background: 'rgb(20 83 45 / 0.98)',
        border: 'rgb(34 197 94 / 0.55)',
        color: 'rgb(220 252 231)',
      },
    },
  },
});

<button use:tooltip={'Saved a minute ago'}>default</button>
<button use:tooltip={{ text: 'Email is required', mode: 'error' }}>error</button>
<button use:tooltip={{ text: 'This replaces the file', mode: 'warning' }}>warning</button>
<button use:tooltip={{ text: 'All checks passed', mode: 'success' }}>success</button>`;
</script>

<Section {id} {label} title="Error and warning colors, plus your own.">
  {#snippet intro()}
    <p>
      <code>mode</code> changes the bubble's colors. <code>error</code> and <code>warning</code> are
      built in. Define another under <code>theme.modes</code> and use it by name, as
      <code>success</code> does here. The bubble also carries a <code>data-mode</code> attribute,
      for styling it in CSS.
    </p>
  {/snippet}

  <div class="row panel live">
    <button class="demo-btn" use:tooltip={'Saved a minute ago'}>default</button>
    <button class="demo-btn" use:tooltip={{ text: 'Email is required', mode: 'error' }}>error</button>
    <button class="demo-btn" use:tooltip={{ text: 'This replaces the file', mode: 'warning' }}>warning</button>
    <button class="demo-btn" use:tooltip={{ text: 'All checks passed', mode: 'success' }}>success</button>
  </div>

  <Code {code} lang="ts" />
</Section>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 56px 24px;
    margin-bottom: 16px;
    justify-content: center;
  }
</style>
