<script lang="ts">
  import CopyButton from './CopyButton.svelte';
  import { INSTALL_COMMAND } from './project';

  interface Props {
    /** Bindable, so callers can react to the copied state. */
    copied?: boolean;
  }

  let { copied = $bindable(false) }: Props = $props();
</script>

<div class="install">
  <code>{INSTALL_COMMAND}</code>
  <CopyButton bind:copied value={INSTALL_COMMAND} tooltipText="Copied" />
</div>

<style>
  .install {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    height: 46px;
    padding: 0 6px 0 16px;
    gap: 14px;
    background: var(--bg-sunken);
    border: 1px solid var(--line-hi);
    border-radius: var(--r);

    --copy-bg: var(--accent);
    --copy-bg-hover: var(--accent);
    --copy-color: var(--accent-ink);
    --copy-color-hover: var(--accent-ink);
    --copy-border: var(--accent);
  }

  code {
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 0;
    background: none;
    border-radius: 0;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--ink);
    white-space: nowrap;
    user-select: all;
  }
  code::-webkit-scrollbar {
    display: none;
  }

  /* The command needs the room on a phone, so the button keeps only its icon. */
  @media (max-width: 480px) {
    .install {
      gap: 10px;
      padding-left: 12px;
    }
    code {
      font-size: 12px;
    }
    .install :global(.copy-label) {
      display: none;
    }
    .install {
      --copy-padding: 0 10px;
    }
  }
</style>
