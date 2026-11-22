// The action
export { tooltip, TIPSY_BUBBLE_ID } from './tooltip';
export type { TooltipConfig, TooltipInput } from './tooltip';

// The portal that renders the bubble
export { default as TooltipPortal } from './TooltipPortal.svelte';

// Global defaults
export { configureTipsy, TRIGGERS } from './config';
export type {
  AnimationConfig,
  ConfigureTipsyOptions,
  Easing,
  EasingPreset,
  KbdTheme,
  ModeStyle,
  ThemeConfig,
  TipsyRuntimeConfig,
  Trigger,
} from './config';

// The store behind the bubble, and the imperative API over it
export {
  cancelPendingHide,
  dismissTooltip,
  forceHideTooltip,
  hideTooltip,
  isWarm,
  showTooltip,
  tooltipStore,
  updateVisibleTooltip,
} from './tooltipStore';
export type { TooltipMode, TooltipShowOptions, TooltipState, VisibleTooltipPatch } from './tooltipStore';

// The placement engine
export { getTooltipBoundaryRect, placeTooltip } from './tooltipPlacement';
export type {
  TooltipBounds,
  TooltipPlacementRequest,
  TooltipPlacementResult,
  TooltipPoint,
  TooltipPosition,
  TooltipRect,
  TooltipSize,
} from './tooltipPlacement';
