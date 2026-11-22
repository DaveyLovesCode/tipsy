<script lang="ts">
  import Install from './Install.svelte';
  import { REPO_URL, TRAILER_POSTER_URL, TRAILER_URL } from './project';

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

    <video
      class="film"
      src={TRAILER_URL}
      poster={TRAILER_POSTER_URL}
      autoplay
      muted
      loop
      playsinline
      aria-label="Tipsy's tooltips gliding between buttons, flipping sides and changing theme"
    ></video>
  </div>
</header>

<style>
  .hero {
    padding-block: clamp(64px, 9vw, 120px);
    border-bottom: 1px solid var(--line);
  }

  .inner {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
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

  .film {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--r);
    background: #050506;
    box-shadow: 0 0 0 1px var(--line), 0 24px 60px rgb(0 0 0 / 0.16);
  }
</style>
