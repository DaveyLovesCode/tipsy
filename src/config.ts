import { writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type { TooltipPosition } from './tooltipPlacement';

export const TRIGGERS = ['hover', 'focus', 'click', 'manual'] as const;
export type Trigger = (typeof TRIGGERS)[number];

export type EasingPreset = 'linear' | 'cubic-out' | 'cubic-in' | 'cubic-in-out';
export type Easing = EasingPreset | ((t: number) => number);

export interface AnimationConfig {
  /** Reveal duration in ms. */
  inDuration: number;
  /** Hide duration in ms. */
  outDuration: number;
  /** Distance the bubble slides in from, in px. 0 fades only. */
  distance: number;
  /** Starting scale, 0 to 1. 1 does not scale. */
  scale: number;
  /** Easing of the reveal: a preset name or your own function. */
  easing: Easing;
}

export interface ModeStyle {
  background?: string;
  border?: string;
  color?: string;
}

export interface KbdTheme {
  background?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string | number;
}

/** Numbers in `radius`, `fontSize`, `letterSpacing` and `inlineGap` are px. */
export interface ThemeConfig {
  background?: string;
  border?: string;
  color?: string;
  radius?: string | number;
  padding?: string;
  shadow?: string;
  zIndex?: number;
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  letterSpacing?: string | number;
  lineHeight?: string | number;
  /** Gap between the text and the kbd chips. */
  inlineGap?: string | number;
  kbd?: KbdTheme;
  /** Looks by `mode` name. `error` and `warning` ship as defaults. */
  modes?: Record<string, ModeStyle>;
}

export interface TipsyRuntimeConfig {
  /** Off suppresses every tooltip, such as while recording a demo. */
  enabled: boolean;

  /** Ms an anchor is hovered or focused before its tooltip shows. */
  defaultDelay: number;
  /** Read on every show in place of `defaultDelay`, for a delay kept in live settings. */
  getDelay?: () => number;
  /** Silences anchors on the default delay while it is 0. An anchor's own `delay: 0` still shows. */
  disableWhenDefaultDelayIsZero: boolean;
  /** Ms after a hide in which the next tooltip skips its delay. */
  warmThreshold: number;
  /** Ms a tooltip lingers once its anchor is left. */
  hideDelay: number;
  /** `hideDelay` for interactive tooltips, long enough for the cursor to reach the bubble. */
  interactiveHideDelay: number;

  /** Preferred side. Another is chosen when this one has no room. */
  position: TooltipPosition;
  /** Centers the bubble on the cursor, within the anchor, in place of the anchor's center. */
  followCursor: boolean;
  /** Px between the anchor and the bubble. */
  gap: number;
  /** Px kept between the bubble and the boundary. */
  edgePadding: number;
  /** Widest the bubble grows, in px. */
  maxWidth: number;
  /** Text longer than this many characters wraps. */
  wrapAt: number;
  /** Selector of the element the bubble stays inside. Null is the viewport. */
  boundarySelector: string | null;

  /** What opens a tooltip. */
  trigger: Trigger[];
  /** Lets the cursor enter the bubble without dismissing it. */
  interactive: boolean;
  /**
   * Pressing an anchor puts its tooltip away until the pointer leaves and comes back.
   * Off, the tooltip stays up through the press, and through a drag until the release.
   */
  hideOnPress: boolean;

  animation: AnimationConfig;
  theme: ThemeConfig;
}

export type ConfigureTipsyOptions = Partial<Omit<TipsyRuntimeConfig, 'trigger' | 'animation'>> & {
  trigger?: Trigger | Trigger[];
  animation?: Partial<AnimationConfig>;
};

export const runtimeConfig: TipsyRuntimeConfig = {
  enabled: true,

  defaultDelay: 900,
  getDelay: undefined,
  disableWhenDefaultDelayIsZero: false,
  warmThreshold: 300,
  hideDelay: 50,
  interactiveHideDelay: 200,

  position: 'top',
  followCursor: false,
  gap: 10,
  edgePadding: 6,
  maxWidth: 280,
  wrapAt: 36,
  boundarySelector: null,

  trigger: ['hover', 'focus'],
  interactive: false,
  hideOnPress: true,

  animation: {
    inDuration: 160,
    outDuration: 160,
    distance: 8,
    scale: 0.63,
    easing: 'cubic-out',
  },
  theme: {
    modes: {
      error: {
        background: 'rgb(127 29 29 / 0.98)',
        border: 'rgb(239 68 68 / 0.55)',
        color: 'rgb(254 226 226)',
      },
      warning: {
        background: 'rgb(120 53 15 / 0.98)',
        border: 'rgb(245 158 11 / 0.55)',
        color: 'rgb(254 243 199)',
      },
    },
  },
};

const version = writable(0);

/** Ticks on every `configureTipsy`, so the portal knows to read `runtimeConfig` again. */
export const configVersion: Readable<number> = version;

const SWITCHES = ['enabled', 'disableWhenDefaultDelayIsZero', 'followCursor', 'interactive', 'hideOnPress'] as const;
const DURATIONS = ['defaultDelay', 'warmThreshold', 'hideDelay', 'interactiveHideDelay'] as const;
const SIZES = ['gap', 'edgePadding', 'maxWidth', 'wrapAt'] as const;

/** Sets global defaults. Each call merges over the ones before it; values of the wrong type are ignored. */
export function configureTipsy(options: ConfigureTipsyOptions): void {
  for (const key of SWITCHES) {
    const value = options[key];
    if (typeof value === 'boolean') runtimeConfig[key] = value;
  }
  for (const key of DURATIONS) {
    const value = options[key];
    if (typeof value === 'number') runtimeConfig[key] = Math.max(0, value);
  }
  for (const key of SIZES) {
    const value = options[key];
    if (typeof value === 'number') runtimeConfig[key] = value;
  }

  if ('getDelay' in options) runtimeConfig.getDelay = options.getDelay;
  if (options.position) runtimeConfig.position = options.position;
  if (typeof options.boundarySelector === 'string' || options.boundarySelector === null) {
    runtimeConfig.boundarySelector = options.boundarySelector;
  }
  if (options.trigger !== undefined) {
    runtimeConfig.trigger = Array.isArray(options.trigger) ? [...options.trigger] : [options.trigger];
  }
  if (options.animation) Object.assign(runtimeConfig.animation, options.animation);
  runtimeConfig.theme = mergeTheme(runtimeConfig.theme, options.theme);

  version.update((n) => n + 1);
}

/** Lays `override` over `base`, merging `kbd` and `modes` entry by entry. */
export function mergeTheme(base: ThemeConfig, override: ThemeConfig | undefined): ThemeConfig {
  if (!override) return base;
  const merged: ThemeConfig = { ...base, ...override };
  if (override.kbd) merged.kbd = { ...base.kbd, ...override.kbd };
  if (override.modes) merged.modes = { ...base.modes, ...override.modes };
  return merged;
}

type CssValue = string | number | undefined;

function px(value: CssValue): CssValue {
  return typeof value === 'number' ? `${value}px` : value;
}

/** An inline style of `--tipsy-*` declarations, skipping the values left unset. */
function cssVars(vars: Record<string, CssValue>): string {
  return Object.entries(vars)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([name, value]) => `--tipsy-${name}: ${value};`)
    .join(' ');
}

export function themeToCssVars(theme: ThemeConfig | undefined): string {
  if (!theme) return '';
  return cssVars({
    bg: theme.background,
    border: theme.border,
    color: theme.color,
    radius: px(theme.radius),
    padding: theme.padding,
    shadow: theme.shadow,
    'z-index': theme.zIndex,
    'font-family': theme.fontFamily,
    'font-size': px(theme.fontSize),
    'font-weight': theme.fontWeight,
    'letter-spacing': px(theme.letterSpacing),
    'line-height': theme.lineHeight,
    'gap-inline': px(theme.inlineGap),
    'kbd-bg': theme.kbd?.background,
    'kbd-color': theme.kbd?.color,
    'kbd-font-family': theme.kbd?.fontFamily,
    'kbd-font-size': px(theme.kbd?.fontSize),
  });
}

export function modeToCssVars(mode: string, theme: ThemeConfig | undefined): string {
  const style = mode && mode !== 'default' ? theme?.modes?.[mode] : undefined;
  if (!style) return '';
  return cssVars({
    'bg-current': style.background,
    'border-current': style.border,
    'color-current': style.color,
  });
}

const EASINGS: Record<EasingPreset, (t: number) => number> = {
  linear: (t) => t,
  'cubic-out': (t) => 1 - Math.pow(1 - t, 3),
  'cubic-in': (t) => t * t * t,
  'cubic-in-out': (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

export function resolveEasing(easing: Easing): (t: number) => number {
  return typeof easing === 'function' ? easing : EASINGS[easing];
}
