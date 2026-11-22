<script lang="ts">
  import { tooltip } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Demo from '../lib/Demo.svelte';

  let { id, label }: { id: string; label: string } = $props();

  const code = `<button use:tooltip={{ text: 'Save', kbd: ['⌘', 'S'] }}>
  Save
</button>

<button use:tooltip={{ text: 'Send', kbd: ['⌘', '⏎'] }}>
  Send
</button>

<button use:tooltip={{ text: 'Command palette', kbd: ['⌘', 'K'] }}>
  Search
</button>`;
</script>

<Section {id} {label} title="Show the shortcut next to the label.">
  {#snippet intro()}
    <p>
      <code>kbd</code> takes an array of strings. Each one renders as a key chip after the text.
      Chips work next to snippet content too.
    </p>
  {/snippet}

  <Demo {code}>
    <button class="demo-btn" use:tooltip={{ text: 'Save', kbd: ['⌘', 'S'] }}>Save</button>
    <button class="demo-btn" data-tone="accent" use:tooltip={{ text: 'Send', kbd: ['⌘', '⏎'] }}>
      Send
    </button>
    <button class="demo-btn" use:tooltip={{ text: 'Command palette', kbd: ['⌘', 'K'] }}>Search</button>
  </Demo>
</Section>
