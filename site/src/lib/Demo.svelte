<script lang="ts">
  import type { Snippet } from 'svelte';
  import Code from './Code.svelte';

  interface Props {
    code: string;
    children: Snippet;
  }

  let { code, children }: Props = $props();
</script>

<div class="demo">
  <div class="stage panel live">
    {@render children()}
  </div>
  <Code {code} />
</div>

<style>
  .demo {
    display: grid;
    /* The code takes the width it needs, up to what the preview can spare, then scrolls. */
    grid-template-columns: minmax(220px, 1fr) minmax(0, max-content);
    gap: 16px;
    align-items: stretch;
  }

  .stage {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    align-content: center;
    justify-content: center;
    padding: 32px 20px;
    min-height: 120px;
  }

  @media (max-width: 800px) {
    .demo {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
