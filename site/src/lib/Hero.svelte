<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { tooltip, tooltipStore } from 'tipsy';
  import Code from './Code.svelte';
  import Install from './Install.svelte';
  import { REPO_URL } from './project';

  const snippet = `<script lang="ts">
  import { TooltipPortal, tooltip } from 'tipsy';
<\/script>

<button use:tooltip={'Run the tests'}>Run</button>

<button use:tooltip={{ text: 'Send', kbd: ['⌘', '⏎'] }}>
  Send
</button>

<TooltipPortal />`;

  let result = $state<HTMLDivElement | null>(null);
  /** Holds the Send tooltip open for a moment once the buttons are on screen, so the page opens on a real tooltip. */
  let preview = $state(false);

  onMount(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timers.push(
          setTimeout(() => {
            // Someone already reading a tooltip keeps it.
            if (get(tooltipStore).visible) return;
            preview = true;
            timers.push(setTimeout(() => (preview = false), 2600));
          }, 600),
        );
      },
      { threshold: 1 },
    );
    if (result) observer.observe(result);

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  });

  function jumpToQuickStart(e: MouseEvent) {
    e.preventDefault();
    document.getElementById('quick-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#quick-start');
  }
</script>

<header id="top" class="hero">
  <div class="container inner">
    <div class="copy">
      <h1>Tooltips for Svelte&nbsp;5.</h1>

      <p class="lede">
        One <code>&lt;TooltipPortal /&gt;</code> at the root and <code>use:tooltip</code> on any
        element. The bubble goes on the side that has room and shows text, shortcut keys or a Svelte
        snippet. No dependencies besides Svelte.
      </p>

      <Install />

      <div class="links">
        <a class="demo-btn" href="#quick-start" onclick={jumpToQuickStart}>Quick start</a>
        <a class="demo-btn" href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
      </div>

      <p class="note">
        The <code>tipsy</code> name on npm is a different package, so install from GitHub.
      </p>
    </div>

    <div class="example">
      <Code code={snippet} label="App.svelte" />
      <div class="result live" bind:this={result}>
        <button class="demo-btn" use:tooltip={'Run the tests'}>Run</button>
        <button
          class="demo-btn"
          data-tone="accent"
          use:tooltip={{ text: 'Send', kbd: ['⌘', '⏎'], show: preview || undefined }}
        >
          Send
        </button>
      </div>
    </div>
  </div>
</header>

<style>
  .hero {
    padding-block: clamp(64px, 9vw, 120px);
    border-bottom: 1px solid var(--line);
  }

  .inner {
    display: grid;
    grid-template-columns: 1.1fr minmax(0, 1fr);
    gap: clamp(40px, 6vw, 88px);
    align-items: center;
  }

  @media (max-width: 1000px) {
    .inner {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .copy {
    min-width: 0;
  }

  h1 {
    font-size: clamp(44px, 6.6vw, 80px);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.045em;
    text-wrap: balance;
    margin-bottom: 28px;
  }

  .lede {
    color: var(--ink-soft);
    font-size: clamp(16px, 1.5vw, 18px);
    line-height: 1.6;
    max-width: 540px;
    margin-bottom: 32px;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .note {
    margin-top: 20px;
    color: var(--ink-mute);
    font-size: 13px;
  }

  /* The code and what it renders, as one card. */
  .example {
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: var(--r);
    overflow: hidden;
  }

  .example :global(.code) {
    border: 0;
    border-radius: 0;
  }

  .result {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 28px 20px;
    border-top: 1px solid var(--line);
    background-color: var(--bg-raised);
  }
</style>
