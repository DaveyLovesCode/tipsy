<script lang="ts">
  import { tooltip } from 'tipsy';

  interface Props {
    /** Text to copy to the clipboard. */
    value: string;
    /** Shown in a tooltip for as long as the copied state lasts. */
    tooltipText: string;
    /** Bindable, so callers can react to the copied state. */
    copied?: boolean;
  }

  let { value, tooltipText, copied = $bindable(false) }: Props = $props();

  /** Ms the copied state lasts. */
  const DURATION = 1100;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard blocked — still flash the UI so the demo works */
    }

    clearTimeout(resetTimer);
    copied = true;
    resetTimer = setTimeout(() => (copied = false), DURATION);
  }
</script>

<button
  type="button"
  class="copy-btn"
  aria-label="Copy"
  onclick={handleClick}
  use:tooltip={{ text: tooltipText, trigger: 'manual', show: copied, position: 'top' }}
>
  <span class="copy-label">Copy</span>
  <span class="copy-slot" aria-hidden="true">
    <span class="copy-stack" class:show-check={copied}>
      <svg class="ic" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4" />
        <path
          d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linecap="round"
        />
      </svg>
      <svg class="ic" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 8.5L6.5 12L13 4.5"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </span>
</button>

<style>
  /* Callers restyle the button through the --copy-* properties. */
  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    height: var(--copy-height, 34px);
    padding: var(--copy-padding, 0 12px);
    background: var(--copy-bg, var(--bg));
    color: var(--copy-color, var(--ink));
    border: 1px solid var(--copy-border, var(--line-hi));
    border-radius: var(--copy-radius, var(--r-sm));
    font-family: var(--font-sans);
    font-size: var(--copy-size, 13px);
    font-weight: 500;
    line-height: 1;
    transition:
      background 120ms ease,
      color 120ms ease;
  }
  .copy-btn:hover {
    background: var(--copy-bg-hover, var(--bg-hover));
    color: var(--copy-color-hover, var(--ink));
  }

  .copy-label {
    user-select: none;
  }

  /* Slot machine — both icons stacked inside a fixed-height clip so the layout
     never shifts between idle and copied. */
  .copy-slot {
    width: 14px;
    height: 14px;
    overflow: hidden;
    position: relative;
    display: inline-block;
    flex-shrink: 0;
  }

  .copy-stack {
    display: flex;
    flex-direction: column;
    transform: translateY(0);
    transition: transform 220ms cubic-bezier(0.2, 0, 0, 1);
  }
  .copy-stack.show-check {
    transform: translateY(-14px);
  }

  .ic {
    display: block;
    flex-shrink: 0;
  }
</style>
