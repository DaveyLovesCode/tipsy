<script lang="ts">
  import Install from './Install.svelte';
  import Logo from './Logo.svelte';
  import { REPO_URL } from './project';
</script>

<footer>
  <div class="container">
    <div class="closing">
      <div>
        <h2>Add it to your app</h2>
        <p>
          Tipsy ships as TypeScript and Svelte source, so it needs Vite with the Svelte plugin, or
          SvelteKit. The README has every option.
        </p>
      </div>
      <div class="actions">
        <Install />
        <a class="demo-btn" href="{REPO_URL}#readme" target="_blank" rel="noreferrer">Read the docs</a>
      </div>
    </div>

    <div class="row">
      <div class="brand">
        <Logo size={16} />
        <span class="tag">Tooltips for Svelte 5</span>
      </div>
      <div class="links">
        <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
        <a href="{REPO_URL}/issues" target="_blank" rel="noreferrer">Issues</a>
        <a href="{REPO_URL}/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT license</a>
      </div>
    </div>
  </div>
</footer>

<style>
  footer {
    border-top: 1px solid var(--line);
  }

  .closing {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 32px 56px;
    align-items: center;
    padding-block: clamp(56px, 8vw, 88px);
  }

  @media (max-width: 900px) {
    .closing {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  h2 {
    font-size: clamp(26px, 3.2vw, 36px);
    line-height: 1.14;
    letter-spacing: -0.03em;
    margin-bottom: 12px;
  }

  .closing p {
    max-width: 520px;
    color: var(--ink-soft);
    font-size: 16px;
    line-height: 1.65;
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
  }

  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px 24px;
    flex-wrap: wrap;
    padding-block: 28px;
    border-top: 1px solid var(--line);
    color: var(--ink-mute);
    font-size: 13px;
  }

  .brand {
    display: inline-flex;
    align-items: baseline;
    gap: 14px;
  }

  .tag {
    line-height: 1;
  }

  .links {
    display: inline-flex;
    gap: 22px;
  }

  .links a {
    transition: color 120ms ease;
  }
  .links a:hover {
    color: var(--ink);
  }
</style>
