<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    /** The section's short name, as the side nav has it. */
    label: string;
    title: string;
    children: Snippet;
    intro?: Snippet;
  }

  let { id, label, title, intro, children }: Props = $props();
</script>

<section {id}>
  <header>
    <p class="kicker"><span class="num" aria-hidden="true"></span>{label}</p>
    <h2>{title}</h2>
    {#if intro}<div class="intro">{@render intro()}</div>{/if}
  </header>

  <div class="body">
    {@render children()}
  </div>
</section>

<style>
  section {
    --pad: clamp(64px, 9vw, 104px);
    --pad-top: var(--pad);
    padding-block: var(--pad-top) var(--pad);
    /* A jump from the side nav or a link stops with the heading 40px below the top bar. */
    scroll-margin-top: calc(var(--topbar-h) + 40px - var(--pad-top));
    border-top: 1px solid var(--line);
    counter-increment: section;
  }

  section:first-of-type {
    --pad-top: clamp(40px, 6vw, 64px);
    border-top: 0;
  }

  header {
    max-width: 660px;
    margin-bottom: 36px;
  }

  .kicker {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 14px;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-mute);
  }

  .num::before {
    content: counter(section, decimal-leading-zero);
    color: var(--ink-faint);
  }

  h2 {
    font-size: clamp(26px, 3.2vw, 36px);
    line-height: 1.14;
    letter-spacing: -0.03em;
    text-wrap: balance;
    margin-bottom: 16px;
  }

  .intro :global(p) {
    color: var(--ink-soft);
    font-size: 16px;
    line-height: 1.65;
  }

  .intro :global(p + p) {
    margin-top: 12px;
  }
</style>
