<script lang="ts">
  import CopyButton from './CopyButton.svelte';
  import { highlight } from './highlight';

  interface Props {
    code: string;
    lang?: string;
    label?: string;
  }

  let { code, lang = 'svelte', label }: Props = $props();

  const tokens = $derived(highlight(code));
</script>

<div class="code">
  <div class="bar">
    <span class="lang">{label ?? lang}</span>
    <CopyButton value={code} tooltipText="Copied" />
  </div>
  <pre><code>{#each tokens as token}{#if token.kind}<span class={token.kind}>{token.text}</span>{:else}{token.text}{/if}{/each}</code></pre>
</div>

<style>
  .code {
    /* As a grid or flex item, a long line scrolls inside the card instead of widening the page. */
    min-width: 0;
    background: var(--bg-sunken);
    border: 1px solid var(--line);
    border-radius: var(--r);
    overflow: hidden;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.7;
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    height: 40px;
    padding: 0 6px 0 16px;
    border-bottom: 1px solid var(--line);

    --copy-height: 28px;
    --copy-padding: 0 9px;
    --copy-size: 12px;
    --copy-bg: transparent;
    --copy-color: var(--ink-mute);
    --copy-border: transparent;
  }

  .lang {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--ink-mute);
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  pre {
    margin: 0;
    padding: 16px 18px 18px;
    overflow-x: auto;
    color: var(--code-fg);
    scrollbar-width: thin;
    scrollbar-color: var(--line-hi) transparent;
  }

  pre code {
    background: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
    font-weight: 400;
    border-radius: 0;
    white-space: inherit;
  }

  /* Tipsy's own names carry the accent, so each sample shows how much of it is Tipsy. */
  .api {
    color: var(--accent);
    font-weight: 600;
  }
  .value {
    color: var(--code-ink);
  }
  .comment {
    color: var(--ink-mute);
  }
  .dim {
    color: var(--code-dim);
  }
</style>
