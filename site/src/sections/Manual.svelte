<script lang="ts">
  import Section from '../lib/Section.svelte';
  import Code from '../lib/Code.svelte';
  import Install from '../lib/Install.svelte';
  import { INSTALL_COMMAND } from '../lib/project';

  let { id, label }: { id: string; label: string } = $props();

  let copied = $state(false);

  const code = `<script lang="ts">
  let copied = $state(false);

  async function handleCopy() {
    await navigator.clipboard.writeText('${INSTALL_COMMAND}');
    copied = true;
    setTimeout(() => (copied = false), 1100);
  }
<\/script>

<button
  onclick={handleCopy}
  use:tooltip={{ text: 'Copied', trigger: 'manual', show: copied }}
>
  Copy
</button>`;
</script>

<Section {id} {label} title="Show it from your own state.">
  {#snippet intro()}
    <p>
      Set <code>trigger: 'manual'</code> and give <code>show</code> a boolean. The tooltip is
      visible while it is true. Every Copy button on this page works this way.
    </p>
  {/snippet}

  <div class="frame panel live">
    <Install bind:copied />
    <p class="hint">
      <code>show: {copied}</code>
      {copied ? 'The tooltip is visible for 1.1 seconds.' : 'Press Copy to set it to true.'}
    </p>
  </div>

  <Code {code} />
</Section>

<style>
  .frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    padding: 48px 24px 36px;
    margin-bottom: 16px;
    text-align: center;
  }
</style>
