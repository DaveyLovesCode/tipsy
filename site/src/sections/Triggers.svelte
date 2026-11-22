<script lang="ts">
  import { tooltip, TRIGGERS } from 'tipsy';
  import type { Trigger } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Code from '../lib/Code.svelte';
  import { hovers } from '../lib/pointer';

  let { id, label }: { id: string; label: string } = $props();

  let active = $state<Trigger>(hovers ? 'hover' : 'click');
  let pinned = $state(false);

  const blurbs: Record<Trigger, string> = {
    hover:
      'Shows when the pointer enters and hides when it leaves. Pressing the anchor puts the tooltip away until the pointer leaves and comes back.',
    focus: 'Shows on focusin and hides on focusout, so the keyboard gets the same tooltip as the mouse.',
    click: 'A click toggles it, and a press anywhere else closes it. This is the trigger that works on touch screens.',
    manual: 'Binds no events. The show prop, or the imperative API, decides when it is visible.',
  };

  const codeFor: Record<Trigger, string> = {
    hover: `<button use:tooltip={{ text: 'Save changes', trigger: 'hover' }}>
  Save
</button>`,
    focus: `<input
  placeholder="Search"
  use:tooltip={{ text: 'Type to search', trigger: 'focus' }}
/>`,
    click: `<button use:tooltip={{ text: 'Press anywhere else to close', trigger: 'click' }}>
  Details
</button>`,
    manual: `<button
  onclick={() => (pinned = !pinned)}
  use:tooltip={{ text: 'show is true', trigger: 'manual', show: pinned }}
>
  Toggle
</button>`,
  };
</script>

<Section {id} {label} title="Open on hover, focus, click, or your own state.">
  {#snippet intro()}
    <p>
      <code>trigger</code> takes one name or an array. The default is
      <code>['hover', 'focus']</code>. Use <code>['hover', 'click']</code> for a tooltip that shows
      on hover and stays open after a click.
    </p>
    <p>
      A touch screen has no hover, so Tipsy binds nothing for <code>hover</code> and
      <code>focus</code> there. This page adds <code>click</code> to its default on touch screens,
      which is why a tap opens the demos.
    </p>
  {/snippet}

  <div class="tabs">
    {#each TRIGGERS as trigger (trigger)}
      <button class="tab" class:active={active === trigger} onclick={() => (active = trigger)}>
        {trigger}
      </button>
    {/each}
  </div>

  <div class="frame">
    <div class="stage panel live">
      {#if active === 'hover'}
        <button class="demo-btn" use:tooltip={{ text: 'Save changes', trigger: 'hover' }}>Save</button>
      {:else if active === 'focus'}
        <input
          class="demo-input"
          placeholder="Search"
          use:tooltip={{ text: 'Type to search', trigger: 'focus' }}
        />
      {:else if active === 'click'}
        <button class="demo-btn" use:tooltip={{ text: 'Press anywhere else to close', trigger: 'click' }}>
          Details
        </button>
      {:else}
        <button
          class="demo-btn"
          onclick={() => (pinned = !pinned)}
          use:tooltip={{ text: 'show is true', trigger: 'manual', show: pinned }}
        >
          Toggle
        </button>
      {/if}
    </div>

    <p class="hint">
      {blurbs[active]}
      {#if !hovers && (active === 'hover' || active === 'focus')}
        Your screen has no hover, so this one does nothing here.
      {/if}
    </p>

    <Code code={codeFor[active]} />
  </div>
</Section>

<style>
  .tabs {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    background: var(--bg-hover);
    border-radius: 9px;
    margin-bottom: 16px;
  }

  .tab {
    height: 30px;
    padding: 0 14px;
    border: 1px solid transparent;
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 12.5px;
    font-weight: 500;
    color: var(--ink-mute);
    transition: color 120ms ease;
  }
  .tab:hover {
    color: var(--ink);
  }
  .tab.active {
    background: var(--bg);
    border-color: var(--line-hi);
    color: var(--ink);
  }

  .frame {
    display: grid;
    gap: 16px;
  }

  /* Room for the longest note and the longest sample, so the page holds still between tabs. */
  .frame .hint {
    min-height: 3em;
  }
  .frame :global(pre) {
    min-height: calc(6 * 1.7em + 34px);
  }

  .stage {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 168px;
    padding: 24px;
  }

  .demo-input {
    width: 240px;
    max-width: 100%;
    height: 36px;
    padding: 0 12px;
    background: var(--bg);
    border: 1px solid var(--line-hi);
    border-radius: 8px;
    font-size: 14px;
    color: var(--ink);
    transition: border-color 120ms ease;
  }
  .demo-input::placeholder {
    color: var(--ink-faint);
  }
  .demo-input:focus {
    outline: none;
    border-color: var(--accent);
  }
</style>
