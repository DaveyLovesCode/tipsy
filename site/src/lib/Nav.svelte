<script lang="ts">
  import { tooltip } from 'tipsy';
  import Logo from './Logo.svelte';
  import { REPO_URL } from './project';
  import { theme, toggleTheme } from './theme.svelte';

  const toggleLabel = $derived(`Switch to ${theme.mode === 'light' ? 'dark' : 'light'} mode`);

  function jumpTop(e: MouseEvent) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', '#top');
  }
</script>

<nav>
  <div class="container row">
    <a href="#top" class="home" onclick={jumpTop} aria-label="Tipsy, back to top">
      <Logo />
      <span class="version">v1</span>
    </a>

    <div class="right">
      <a class="link" href="{REPO_URL}#readme" target="_blank" rel="noreferrer">Docs</a>

      <!-- A tap on a touch screen switches the theme, so the label stays a hover and focus tooltip. -->
      <button
        class="icon-btn"
        type="button"
        onclick={toggleTheme}
        aria-label={toggleLabel}
        use:tooltip={{ text: toggleLabel, position: 'bottom', trigger: ['hover', 'focus'] }}
      >
        {#if theme.mode === 'light'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        {/if}
      </button>

      <a class="demo-btn github" href={REPO_URL} target="_blank" rel="noreferrer">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
        GitHub
      </a>
    </div>
  </div>
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    z-index: 50;
    height: var(--topbar-h);
    background: var(--bg);
    border-bottom: 1px solid var(--line);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    gap: 24px;
  }

  .home {
    display: inline-flex;
    align-items: baseline;
    gap: 10px;
  }

  .version {
    font-family: var(--font-mono);
    font-size: 11.5px;
    line-height: 1;
    color: var(--ink-mute);
  }

  @media (max-width: 400px) {
    .version {
      display: none;
    }
  }

  .right {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .link {
    display: inline-flex;
    align-items: center;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    color: var(--ink-soft);
    font-size: 13px;
    font-weight: 500;
    transition:
      color 120ms ease,
      background 120ms ease;
  }
  .link:hover {
    color: var(--ink);
    background: var(--bg-hover);
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    color: var(--ink-soft);
    transition:
      color 120ms ease,
      background 120ms ease;
  }
  .icon-btn:hover {
    color: var(--ink);
    background: var(--bg-hover);
  }

  .github {
    margin-left: 8px;
  }
</style>
