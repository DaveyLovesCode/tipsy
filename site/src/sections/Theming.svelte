<script lang="ts">
  import { tooltip, configureTipsy } from 'tipsy';
  import type { ThemeConfig } from 'tipsy';
  import Section from '../lib/Section.svelte';
  import Code from '../lib/Code.svelte';
  import { pointVerb } from '../lib/pointer';
  import { theme as siteTheme, tooltipThemes } from '../lib/theme.svelte';

  let { id, label }: { id: string; label: string } = $props();

  type Preset = {
    id: string;
    name: string;
    description: string;
    theme: ThemeConfig;
  };

  // `configureTipsy` merges, so each preset sets the same fields and none inherits from the last one picked.
  const presets: Preset[] = [
    {
      id: 'default',
      name: 'Default',
      description: 'What you get with no theme set.',
      theme: {
        background: 'rgb(38 38 38 / 0.98)',
        border: 'rgb(255 255 255 / 0.12)',
        color: 'rgb(229 229 229)',
        radius: 6,
        padding: '4px 8px',
        fontFamily: 'inherit',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0,
        shadow: '0 10px 28px rgb(0 0 0 / 0.45), 0 3px 10px rgb(0 0 0 / 0.3)',
        kbd: { background: 'rgb(0 0 0 / 0.24)', color: 'rgb(212 212 212)' },
      },
    },
    {
      id: 'mono',
      name: 'Mono',
      description: 'Monospace, with square corners.',
      theme: {
        background: '#0c0c0d',
        border: 'rgb(255 255 255 / 0.22)',
        color: '#e6e6e6',
        radius: 2,
        padding: '4px 8px',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: '0.02em',
        shadow: 'none',
        kbd: { background: 'rgb(255 255 255 / 0.14)', color: '#e6e6e6' },
      },
    },
    {
      id: 'paper',
      name: 'Paper',
      description: 'White, with a soft shadow.',
      theme: {
        background: '#ffffff',
        border: 'rgb(0 0 0 / 0.1)',
        color: '#18181b',
        radius: 8,
        padding: '6px 10px',
        fontFamily: 'inherit',
        fontSize: 12.5,
        fontWeight: 500,
        letterSpacing: 0,
        shadow: '0 12px 32px rgb(0 0 0 / 0.14), 0 2px 6px rgb(0 0 0 / 0.08)',
        kbd: { background: 'rgb(0 0 0 / 0.06)', color: '#52525b' },
      },
    },
    {
      id: 'pill',
      name: 'Pill',
      description: 'Fully rounded, in one solid color.',
      theme: {
        background: '#7559ff',
        border: '#7559ff',
        color: '#ffffff',
        radius: 999,
        padding: '5px 12px',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0,
        shadow: '0 6px 16px rgb(0 0 0 / 0.18)',
        kbd: { background: 'rgb(255 255 255 / 0.22)', color: '#ffffff' },
      },
    },
    {
      id: 'note',
      name: 'Note',
      description: 'Yellow, with a hard offset shadow.',
      theme: {
        background: '#ffe14d',
        border: '#1c1a0c',
        color: '#1c1a0c',
        radius: 3,
        padding: '5px 9px',
        fontFamily: 'inherit',
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: 0,
        shadow: '3px 3px 0 #1c1a0c',
        kbd: { background: 'rgb(0 0 0 / 0.1)', color: '#1c1a0c' },
      },
    },
  ];

  /** The picked preset, or null while the tooltips wear the site's own theme. */
  let active = $state.raw<Preset | null>(null);

  // Toggling the site theme in the nav puts the site's tooltip theme back on,
  // so the picked preset no longer shows.
  $effect(() => {
    void siteTheme.mode;
    active = null;
  });

  function pick(preset: Preset) {
    active = preset;
    configureTipsy({ theme: preset.theme });
  }

  function resetToSite() {
    active = null;
    configureTipsy({ theme: tooltipThemes[siteTheme.mode] });
  }

  const shown = $derived(active?.theme ?? tooltipThemes[siteTheme.mode]);

  /** The `configureTipsy` call that applies `theme`, with object keys unquoted. */
  function codeFor(theme: ThemeConfig): string {
    const literal = JSON.stringify(theme, null, 2)
      .replace(/"([^"]+)":/g, '$1:')
      .replace(/"((?:[^"\\]|\\.)*)"/g, (_, text: string) => `'${text.replace(/\\"/g, '"')}'`)
      .replace(/\n/g, '\n  ');
    return `configureTipsy({\n  theme: ${literal},\n});`;
  }
</script>

<Section {id} {label} title="Theme it with one typed object.">
  {#snippet intro()}
    <p>
      Pass <code>theme</code> to <code>configureTipsy</code>, or to a
      <code>&lt;TooltipPortal /&gt;</code> to override it for that portal. Numbers in fields like
      <code>radius</code> and <code>fontSize</code> are pixels. Each field is also a
      <code>--tipsy-*</code> CSS variable.
    </p>
    <p>Pick a preset. Every tooltip on this page changes with it.</p>
  {/snippet}

  <div class="presets">
    <button class="preset" class:active={active === null} onclick={resetToSite}>
      <span
        class="swatch"
        style="background: {tooltipThemes[siteTheme.mode].background}; border-radius: 7px;"
        aria-hidden="true"
      ></span>
      <span class="meta">
        <span class="name">This site</span>
        <span class="desc">Follows the light and dark toggle.</span>
      </span>
    </button>
    {#each presets as preset (preset.id)}
      <button class="preset" class:active={active === preset} onclick={() => pick(preset)}>
        <span
          class="swatch"
          style="background: {preset.theme.background}; border-radius: min({preset.theme.radius}px, 50%);"
          aria-hidden="true"
        ></span>
        <span class="meta">
          <span class="name">{preset.name}</span>
          <span class="desc">{preset.description}</span>
        </span>
      </button>
    {/each}
  </div>

  <div class="probe panel live">
    <button class="demo-btn" use:tooltip={'A short label'}>Label</button>
    <button class="demo-btn" use:tooltip={{ text: 'With a shortcut', kbd: ['⌘', 'K'] }}>Shortcut</button>
    <button class="demo-btn" use:tooltip={{ text: 'Text longer than 36 characters wraps, up to 280 pixels wide.' }}>
      Long text
    </button>
    <p class="hint">{pointVerb} a button to see the theme.</p>
  </div>

  <Code code={codeFor(shown)} lang="ts" label={active ? `theme: ${active.name}` : `theme: this site, ${siteTheme.mode}`} />
</Section>

<style>
  .presets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }

  .preset {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding: 12px 14px;
    background: var(--bg-raised);
    border: 1px solid var(--line);
    border-radius: var(--r);
    transition:
      border-color 120ms ease,
      background 120ms ease;
  }
  .preset:hover {
    background: var(--bg-hover);
  }
  .preset.active {
    border-color: var(--accent);
    background: var(--bg-raised);
  }

  .swatch {
    width: 28px;
    height: 28px;
    border: 1px solid var(--line-hi);
    flex-shrink: 0;
  }

  .meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .name {
    font-size: 13.5px;
    font-weight: 600;
    line-height: 1.4;
  }

  .desc {
    font-size: 12px;
    line-height: 1.4;
    color: var(--ink-mute);
  }

  .probe {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 56px 24px 20px;
    margin-bottom: 16px;
  }

  .probe .hint {
    flex-basis: 100%;
    margin-top: 16px;
    text-align: center;
  }
</style>
