<script lang="ts">
  interface Props {
    value: number;
    min: number;
    max: number;
    step?: number;
    'aria-label'?: string;
  }

  let {
    value = $bindable(0),
    min,
    max,
    step = 1,
    'aria-label': ariaLabel,
  }: Props = $props();

  let pct = $derived(((value - min) / (max - min)) * 100);
</script>

<input
  type="range"
  {min}
  {max}
  {step}
  bind:value
  aria-label={ariaLabel}
  style="--pct: {pct}%"
/>

<style>
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 20px;
    /* Two flat colors with a hard stop at the value: the filled and unfilled track. */
    background:
      linear-gradient(
        to right,
        var(--accent) 0,
        var(--accent) var(--pct, 50%),
        var(--line-hi) var(--pct, 50%),
        var(--line-hi) 100%
      )
      no-repeat;
    background-size: 100% 3px;
    background-position: left center;
    border-radius: 2px;
    cursor: pointer;
    margin: 0;
    padding: 0;
    display: block;
  }

  input[type='range']:focus {
    outline: none;
  }

  /* Webkit / Blink */
  input[type='range']::-webkit-slider-runnable-track {
    height: 3px;
    background: transparent;
    border: none;
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    border: 2px solid var(--bg-raised);
    box-sizing: content-box;
    margin-top: -7.5px;
  }
  input[type='range']:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  /* Firefox */
  input[type='range']::-moz-range-track {
    height: 3px;
    background: transparent;
    border: none;
  }
  input[type='range']::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--accent);
    border: 2px solid var(--bg-raised);
  }
  input[type='range']:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
</style>
