<script lang="ts">
  import { tooltip } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Demo from '../lib/Demo.svelte';

  let { id, label }: { id: string; label: string } = $props();

  const code = `<!-- App.svelte, or +layout.svelte in SvelteKit -->
<script lang="ts">
  import { TooltipPortal, tooltip } from 'tipsy';
<\/script>

<button use:tooltip={'Open the launcher'}>
  Launcher
</button>

<button use:tooltip={{ text: 'Send', kbd: ['⌘', '⏎'] }}>
  Send
</button>

<TooltipPortal />`;
</script>

<Section {id} {label} title="Mount the portal once. Add the action anywhere.">
  {#snippet intro()}
    <p>
      Put <code>&lt;TooltipPortal /&gt;</code> near the root of your app. It renders the one bubble
      that every anchor shares. Then add <code>use:tooltip</code> to any element. A string is short
      for <code>{'{ text }'}</code>.
    </p>
    <p>Every tooltip on this page is Tipsy, including the one on the theme button in the top bar.</p>
  {/snippet}

  <Demo {code}>
    <button class="demo-btn" use:tooltip={'Open the launcher'}>Launcher</button>
    <button class="demo-btn" data-tone="accent" use:tooltip={{ text: 'Send', kbd: ['⌘', '⏎'] }}>
      Send
    </button>
  </Demo>
</Section>
