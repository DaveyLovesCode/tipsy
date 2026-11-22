import { tick } from 'svelte';
import type { AnimationConfig, ThemeConfig } from 'tipsy';

export type ThemeMode = 'light' | 'dark';

export const theme = $state<{ mode: ThemeMode }>({ mode: 'light' });

const STORAGE_KEY = 'tipsy-site-theme';

export function setTheme(mode: ThemeMode) {
  theme.mode = mode;
  document.documentElement.setAttribute('data-theme', mode);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage blocked */
  }
}

export function toggleTheme() {
  const next = theme.mode === 'light' ? 'dark' : 'light';
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTheme(next);
    return;
  }
  // Cross-fades the whole page, so no element changes color before another.
  document.startViewTransition(() => {
    setTheme(next);
    return tick();
  });
}

/** Adopts the theme `index.html` chose before the first paint. */
export function initTheme() {
  theme.mode = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** How every tooltip on the site animates, until the Animation section's sliders change it. */
export const tooltipAnimation = {
  inDuration: 220,
  outDuration: 160,
  distance: 6,
  scale: 0.9,
  easing: 'cubic-out',
} satisfies AnimationConfig;

const tooltipShape = {
  radius: 7,
  padding: '5px 9px',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: 0,
} satisfies ThemeConfig;

/**
 * The site's own tooltip look: the inverse of the page, so the bubble is the
 * strongest thing on screen. `configureTipsy` merges themes, so these set every
 * field a preset in the Theming section sets, which lets "This site" undo a preset.
 */
export const tooltipThemes: Record<ThemeMode, ThemeConfig> = {
  light: {
    background: '#18181b',
    border: '#18181b',
    color: '#fafafa',
    ...tooltipShape,
    shadow: '0 8px 24px rgb(0 0 0 / 0.16), 0 2px 6px rgb(0 0 0 / 0.12)',
    kbd: { background: 'rgb(255 255 255 / 0.16)', color: '#fafafa' },
  },
  dark: {
    background: '#fafafa',
    border: '#fafafa',
    color: '#18181b',
    ...tooltipShape,
    shadow: '0 8px 24px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.4)',
    kbd: { background: 'rgb(0 0 0 / 0.08)', color: '#3f3f46' },
  },
};
