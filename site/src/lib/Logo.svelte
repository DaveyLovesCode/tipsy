<script lang="ts">
  interface Props {
    /** Font size of the wordmark, in px. The mark scales with it. */
    size?: number;
  }

  let { size = 21 }: Props = $props();
</script>

<!-- No space between the mark and the name: they are inline, and a space would add to the gap. -->
<span class="logo" style="--size: {size}px"
  ><svg class="mark" viewBox="3 4 26 23.6" aria-hidden="true">
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M11 4h10a8 8 0 0 1 8 8v2a8 8 0 0 1-8 8h-4l-2.7 5.4a.34.34 0 0 1-.6 0L11 22a8 8 0 0 1-8-8v-2a8 8 0 0 1 8-8Zm-1 9a2 2 0 1 0 4 0a2 2 0 1 0-4 0Zm8 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z"
    />
  </svg><span class="name">tipsy</span></span
>

<style>
  .logo {
    display: inline-block;
    font-family: var(--font-wordmark);
    font-size: var(--size);
    line-height: 1;
    white-space: nowrap;
  }

  /*
    Set against the wordmark's own metrics. Poppins has an x-height of 0.534em and
    descenders 0.268em deep, so at this height the bubble's body centers on the
    x-height and its tail ends where the p and y do.
  */
  .mark {
    display: inline-block;
    height: 0.865em;
    width: auto;
    vertical-align: -0.268em;
    margin-right: 0.4em;
    color: var(--accent);
  }

  .name {
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--ink);
  }
</style>
