# Tipsy

https://github.com/user-attachments/assets/a8ad0bdd-2cdc-4e0f-b813-14151839e369

Tooltips for Svelte 5. [Try every example on the demo site](https://daveylovescode.github.io/tipsy/).

Mount one `<TooltipPortal />` at the root and put `use:tooltip` on any element. The bubble goes on the side that has room and shows text, shortcut keys or a Svelte snippet. No dependencies besides Svelte.

```svelte
<script lang="ts">
  import { TooltipPortal, tooltip } from 'tipsy';
</script>

<button use:tooltip={'Run the tests'}>Run</button>
<button use:tooltip={{ text: 'Send', kbd: ['⌘', '⏎'] }}>Send</button>

<TooltipPortal />
```

Most apps need nothing more than that.

---

## What it does

- **One bubble for the whole page.** Anchors don't get their own tooltip elements, so there are no z-index or stacking problems.
- **Placement.** It measures the room on all four sides, uses your preferred side when it fits, flips to the side across from it when it doesn't, and keeps the bubble inside the viewport or a container you name.
- **A row of buttons feels quick.** The first hover waits for the delay. Moving to the next anchor within 300 ms shows its tooltip right away, and the bubble glides over and reshapes itself on the way.
- **It moves, never jumps.** When the room runs out and the bubble has to change sides, it swings around its anchor and stays inside the boundary the whole way.
- **Snippets and shortcut keys.** Any Svelte snippet can be the content, and `kbd` adds shortcut chips after the text.
- **Typed theme and animation.** Set colors, type, radius and motion with `configureTipsy`. The CSS variables are there too.
- **Triggers.** `hover`, `focus`, `click` and `manual`, alone or together, plus bubbles the cursor can move into.
- **Pressing hides it.** Pressing an anchor puts its tooltip away, even in hosts that never send the mouse-up.
- **Accessible.** The anchor's `aria-describedby` points at the bubble while it shows, and keyboard focus shows it too.

---

## Install

```bash
npm install github:DaveyLovesCode/tipsy
```

Tipsy ships as TypeScript and Svelte source, so it needs a bundler that compiles Svelte: Vite with the Svelte plugin, or SvelteKit. Peer dependency: `svelte ^5.0.0`.

> Install from GitHub as shown. The `tipsy` name on npm belongs to an unrelated package.

---

## Mental model

There is exactly **one** tooltip on screen at a time, held in one global store:

1. `<TooltipPortal />` renders the bubble. Mount it **once**.
2. `use:tooltip={config}` attaches to any element. It binds the configured triggers and tells the store when to show and hide.
3. `configureTipsy({...})` sets global defaults. Call it at app startup.

When the cursor moves from one anchor to the next, the tooltip changes hands without a second portal or a stacking fight.

> **Singleton by design.** Every mounted `<TooltipPortal />` renders the same tooltip, so two portals in one document draw it twice. Mount one per document.

---

## The `tooltip` action

```ts
use:tooltip={ string | TooltipConfig | null | false | undefined }
```

A bare string is shorthand for `{ text }`. `null`, `false`, `undefined` and empty strings show no tooltip, which is useful for conditional labels.

### `TooltipConfig`

| Field              | Type                                          | Default                       | Notes                                                                       |
| ------------------ | --------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `text`             | `string`                                      | `''`                          | Plain-text body. Ignored when `content` is set.                             |
| `content`          | `Snippet`                                     | —                             | A Svelte snippet rendered in place of `text`.                               |
| `kbd`              | `string[]`                                    | —                             | Each token renders as a chip after the text.                                |
| `position`         | `'top' \| 'bottom' \| 'left' \| 'right'`      | see below                     | Preferred side. Another is chosen when this one has no room.                |
| `followCursor`     | `boolean`                                     | global (`false`)              | Center on the cursor's X (top/bottom) or Y (left/right) within the anchor.  |
| `delay`            | `number` (ms)                                 | global (`900`)                | `0` shows at once.                                                          |
| `mode`             | `'default' \| 'error' \| 'warning' \| string` | `'default'`                   | Sets `data-mode` and applies the matching `theme.modes` entry.              |
| `show`             | `boolean`                                     | —                             | Forces visibility. `true` shows, `false` hides, unset follows the triggers. |
| `trigger`          | `Trigger \| Trigger[]`                        | global (`['hover', 'focus']`) | `'hover'`, `'focus'`, `'click'`, `'manual'`.                                |
| `interactive`      | `boolean`                                     | global (`false`)              | Lets the cursor enter the bubble without dismissing it.                     |
| `hideOnPress`      | `boolean`                                     | global (`true`)               | Pressing the anchor puts its tooltip away. See [Pressing an anchor](#pressing-an-anchor). |
| `maxWidth`         | `number` (px)                                 | portal, then global (`280`)   | Widest the bubble grows.                                                    |
| `gap`              | `number` (px)                                 | global (`10`)                 | Distance between anchor and bubble.                                         |
| `edgePadding`      | `number` (px)                                 | global (`6`)                  | Distance kept from the boundary.                                            |
| `boundarySelector` | `string`                                      | portal, then global           | The element the bubble stays inside. The viewport by default.               |
| `getRect`          | `(node: HTMLElement) => TooltipRect`          | —                             | Anchors to a rect other than the node's own. See [Custom anchor rect](#custom-anchor-rect). |

`position` falls back to the nearest ancestor's `data-tooltip-position` attribute, then to the global default (`'top'`). Set the attribute on a container to choose the side for every tooltip inside it:

```svelte
<nav data-tooltip-position="bottom">
  <button use:tooltip={'Back'}>←</button>
  <button use:tooltip={'Forward'}>→</button>
</nav>
```

### Examples

```svelte
<!-- Plain string -->
<button use:tooltip={'Open settings'}>⚙</button>

<!-- Conditional -->
<button use:tooltip={isReady ? 'Run' : null}>Run</button>

<!-- Shortcut chips -->
<button use:tooltip={{ text: 'Save', kbd: ['⌘', 'S'] }}>Save</button>

<!-- A label that changes while showing updates in place, without animating in again -->
<button use:tooltip={isSaving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}>Save</button>

<!-- Status modes -->
<input use:tooltip={{ text: 'Required', mode: 'error' }} />
<input use:tooltip={{ text: 'Will overwrite', mode: 'warning' }} />

<!-- Forced visibility, such as an onboarding hint -->
<button use:tooltip={{ text: 'Try this!', show: showHint }}>New</button>

<!-- Per-anchor placement and width -->
<span use:tooltip={{ text: longText, position: 'bottom', maxWidth: 320 }}>?</span>
```

### Snippet content

Pass any Svelte snippet as `content` for rich tooltips:

```svelte
<script lang="ts">
  import { tooltip } from 'tipsy';
  let warnings = $state(3);
</script>

{#snippet richTip()}
  <div class="rich-tip">
    <strong>{warnings} warnings</strong>
    <p>Click to view details.</p>
  </div>
{/snippet}

<button use:tooltip={{ content: richTip, interactive: true, trigger: 'click' }}>
  ⚠ {warnings}
</button>
```

The snippet keeps its component's reactive scope, so `warnings` stays live while it renders in the portal. Style its markup with global CSS, since it renders outside the component that declares it. `kbd` chips still work alongside snippet content.

---

## Triggers

```ts
type Trigger = 'hover' | 'focus' | 'click' | 'manual';
```

The default is `['hover', 'focus']`. Pass one trigger or an array of several.

| Trigger    | Behavior                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------- |
| `'hover'`  | Shows on `mouseenter`, hides on `mouseleave`. A press puts it away; see below.           |
| `'focus'`  | Shows on `focusin`, hides on `focusout`.                                                 |
| `'click'`  | Toggles on click. A press anywhere else dismisses it.                                    |
| `'manual'` | Binds no events. Drive the tooltip with `show` or the [imperative API](#imperative-api). |

```svelte
<!-- Click-only toggle -->
<button use:tooltip={{ text: 'Settings', trigger: 'click' }}>⚙</button>

<!-- Hover preview that a click pins -->
<button use:tooltip={{ content: details, trigger: ['hover', 'click'], interactive: true }}>
  Details
</button>

<!-- Driven entirely by `show` -->
<input
  bind:value
  use:tooltip={{ text: 'Email looks invalid', mode: 'error', trigger: 'manual', show: !isValidEmail }}
/>
```

On devices without hover (touch screens), the `hover` and `focus` triggers bind nothing, because a tap would open the tooltip and leave it stuck. `click` and `show` work everywhere.

### Pressing an anchor

Pressing a hover anchor puts its tooltip away, and it stays away until the pointer leaves the anchor and comes back, which waits the full delay again. The focus the press gives the anchor doesn't bring it back either. This needs no release event, so it also works in hosts that never deliver one, such as After Effects panels on macOS.

Set `hideOnPress: false` on an anchor, or globally, to keep the tooltip up through the press instead, and through a drag until the release. That suits draggable anchors and sliders whose tooltip should stay attached while they move. A `'click'` anchor always works this way, since its press is what toggles it.

---

## Interactive mode

By default the bubble is `pointer-events: none` and the cursor passes through it. Set `interactive: true` to let the cursor enter the bubble, for example to click a link inside:

```svelte
{#snippet help()}
  <p>Need help? <a href="/docs">Read the docs</a></p>
{/snippet}

<button use:tooltip={{ content: help, interactive: true }}>?</button>
```

An interactive tooltip waits `interactiveHideDelay` (200 ms) before hiding, which gives the cursor time to cross the gap from anchor to bubble. It stays up while the cursor is inside the bubble and hides once the cursor leaves.

---

## The `<TooltipPortal />` component

Mount it once at the app root. Every `use:tooltip` on the page shares it.

```svelte
<TooltipPortal />
```

### Props

Each prop overrides the global config for this portal. Without it, the value set through `configureTipsy` applies.

| Prop               | Type                       | Notes                                                        |
| ------------------ | -------------------------- | ------------------------------------------------------------ |
| `theme`            | `ThemeConfig`              | Merged over the global theme.                                |
| `animation`        | `Partial<AnimationConfig>` | Merged over the global animation.                            |
| `maxWidth`         | `number`                   | Widest the bubble grows, in px.                              |
| `wrapAt`           | `number`                   | Text longer than this many characters wraps.                 |
| `boundarySelector` | `string \| null`           | The element the bubble stays inside. `null` is the viewport. |
| `class`            | `string`                   | Extra classes on the bubble.                                 |
| `style`            | `string`                   | Inline style on the bubble: raw CSS, variables included.     |

### Where to mount it

```svelte
<!-- src/routes/+layout.svelte (SvelteKit) -->
<script lang="ts">
  import { TooltipPortal } from 'tipsy';
  let { children } = $props();
</script>

{@render children()}
<TooltipPortal />
```

Plain Svelte apps mount it at the bottom of `App.svelte`. Keep it outside any positioned or transformed container: the bubble is placed in document coordinates. It renders nothing while no tooltip is showing.

---

## Global configuration

Call `configureTipsy` at app startup. Every field is optional, and later calls merge over earlier ones.

```ts
import { configureTipsy } from 'tipsy';

configureTipsy({
  defaultDelay: 600,
  position: 'bottom',
  maxWidth: 320,
  animation: { distance: 0, scale: 1 }, // fade only
  theme: {
    background: 'var(--surface-3)',
    color: 'var(--ink-primary)',
    border: 'var(--hairline)',
    radius: 6,
  },
});
```

### `TipsyRuntimeConfig` reference

| Field                           | Type                   | Default                     | Notes                                                                             |
| ------------------------------- | ---------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| `enabled`                       | `boolean`              | `true`                      | `false` suppresses every tooltip, such as while recording a demo.                 |
| `defaultDelay`                  | `number`               | `900`                       | Ms an anchor is hovered or focused before its tooltip shows.                      |
| `getDelay`                      | `() => number`         | —                           | Read on every show in place of `defaultDelay`, for a delay kept in live settings. |
| `disableWhenDefaultDelayIsZero` | `boolean`              | `false`                     | Silences anchors on the default delay while it is `0`. An anchor's own `delay: 0` still shows. |
| `warmThreshold`                 | `number`               | `300`                       | Ms after a hide in which the next tooltip skips its delay.                        |
| `hideDelay`                     | `number`               | `50`                        | Ms a tooltip lingers once its anchor is left.                                     |
| `interactiveHideDelay`          | `number`               | `200`                       | `hideDelay` for interactive tooltips.                                             |
| `position`                      | `TooltipPosition`      | `'top'`                     | Preferred side.                                                                   |
| `followCursor`                  | `boolean`              | `false`                     | Center on the cursor, within the anchor, in place of the anchor's center.         |
| `gap`                           | `number`               | `10`                        | Px between anchor and bubble.                                                     |
| `edgePadding`                   | `number`               | `6`                         | Px kept from the boundary.                                                        |
| `maxWidth`                      | `number`               | `280`                       | Widest the bubble grows, in px.                                                   |
| `wrapAt`                        | `number`               | `36`                        | Text longer than this many characters wraps.                                      |
| `boundarySelector`              | `string \| null`       | `null`                      | The element the bubble stays inside. `null` is the viewport.                      |
| `trigger`                       | `Trigger \| Trigger[]` | `['hover', 'focus']`        | What opens a tooltip. Applies to anchors mounted or updated after the call.       |
| `interactive`                   | `boolean`              | `false`                     | Lets the cursor enter the bubble.                                                 |
| `hideOnPress`                   | `boolean`              | `true`                      | Pressing an anchor puts its tooltip away until the pointer leaves and comes back. |
| `animation`                     | `AnimationConfig`      | see [Animation](#animation) | How the bubble appears and disappears.                                            |
| `theme`                         | `ThemeConfig`          | `error` and `warning` modes | How the bubble looks. See [Theming](#theming).                                    |

---

## Theming

The typed `theme` API is the recommended way to style tooltips.

```ts
configureTipsy({
  theme: {
    background: 'var(--surface-3)',
    border: 'var(--hairline)',
    color: 'var(--fg)',
    radius: 6,
    padding: '4px 8px',
    shadow: '0 8px 20px rgb(0 0 0 / 0.4)',
    zIndex: 99999,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: 0,
    lineHeight: 1.35,
    inlineGap: 6, // between the text and the kbd chips
    kbd: {
      background: 'rgb(0 0 0 / 0.24)',
      color: 'rgb(212 212 212)',
      fontFamily: 'ui-monospace, Menlo, monospace',
      fontSize: 10,
    },
    modes: {
      error: { background: 'var(--surface-3)', color: '#e0a09b', border: 'rgb(197 86 79 / 0.55)' },
      pro: { background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: 'white', border: 'transparent' },
    },
  },
});
```

Anything you leave unset keeps the bubble's built-in look. Numbers in `radius`, `fontSize`, `letterSpacing`, `inlineGap` and `kbd.fontSize` are pixels.

### Per-portal theme

Pass `theme` to a `<TooltipPortal />` to override the global theme for that mount, such as a sub-window with its own design tokens:

```svelte
<TooltipPortal theme={{ background: 'rgb(38 38 38 / 0.95)', fontSize: 12, zIndex: 9999 }} />
```

### Custom modes

`error` and `warning` are built in. Define your own in `theme.modes` and name it in `mode`:

```svelte
<button use:tooltip={{ text: 'Pro feature', mode: 'pro' }}>…</button>
```

A mode's `background`, `border` and `color` replace the theme's for that tooltip. The bubble also carries `data-mode`, so you can write CSS against `[data-mode='pro']`.

### CSS variables

The `style` prop on `<TooltipPortal />` takes plain CSS, including the variables the theme API sets, for a pure-CSS theming pipeline:

```svelte
<TooltipPortal style="--tipsy-bg: var(--surface-3); --tipsy-z-index: 99999;" />
```

The variables: `--tipsy-bg`, `--tipsy-border`, `--tipsy-color`, `--tipsy-radius`, `--tipsy-padding`, `--tipsy-shadow`, `--tipsy-z-index`, `--tipsy-font-family`, `--tipsy-font-size`, `--tipsy-font-weight`, `--tipsy-letter-spacing`, `--tipsy-line-height`, `--tipsy-gap-inline`, `--tipsy-kbd-bg`, `--tipsy-kbd-color`, `--tipsy-kbd-font-family`, `--tipsy-kbd-font-size`. Modes set `--tipsy-bg-current`, `--tipsy-border-current` and `--tipsy-color-current`.

---

## Animation

The bubble fades in while it scales up and slides toward its anchor, then fades out. Once it is up it travels: to the next anchor when the pointer moves on, and round its own anchor when it has to change sides.

```ts
configureTipsy({
  animation: {
    inDuration: 160, // ms
    outDuration: 160, // ms
    distance: 8, // px it slides in from; 0 fades only
    scale: 0.63, // starting scale, 0 to 1; 1 does not scale
    easing: 'cubic-out', // 'linear' | 'cubic-out' | 'cubic-in' | 'cubic-in-out', or (t) => number
    moveDuration: 240, // ms to travel to another anchor or another side; 0 jumps
  },
});
```

These are the defaults. Pass `animation` to `<TooltipPortal />` to override them for one portal.

---

## Boundary

By default the bubble stays inside the viewport. To keep it inside one region, such as a panel in a host app or a sub-window, name that element globally, per portal, or per tooltip:

```ts
configureTipsy({ boundarySelector: '#my-panel' });
```

```svelte
<TooltipPortal boundarySelector="#my-panel" />

<button use:tooltip={{ text: 'Hi', boundarySelector: '#my-panel' }}>…</button>
```

A tooltip hides when its anchor leaves the boundary or scrolls out of the viewport.

---

## Imperative API

For tooltips on things that are not elements, such as canvas hits and virtual list rows.

```ts
import {
  showTooltip,
  hideTooltip,
  forceHideTooltip,
  dismissTooltip,
  cancelPendingHide,
  updateVisibleTooltip,
  tooltipStore,
  isWarm,
} from 'tipsy';
```

| Function                                | What it does                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `showTooltip(options, rect)`            | Shows a tooltip anchored to any rect.                                                           |
| `hideTooltip(ownerId?, delayOverride?)` | Hides after `hideDelay`, or `delayOverride` ms. With an `ownerId`, only that owner's tooltip.   |
| `forceHideTooltip(ownerId?)`            | Hides without the grace period.                                                                 |
| `dismissTooltip()`                      | Hides whatever is showing and forgets the warm state, so the next tooltip waits its full delay. |
| `cancelPendingHide()`                   | Keeps the tooltip up through a hide that is still waiting out its delay.                        |
| `updateVisibleTooltip(patch, ownerId?)` | Changes the visible tooltip in place, without animating it in again.                            |
| `tooltipStore`                          | The `Writable<TooltipState>` behind the bubble. Subscribe for analytics, devtools or tests.     |
| `isWarm()`                              | `true` while a tooltip is visible or one hid within `warmThreshold`.                            |

`showTooltip` takes the fields the action takes (`text`, `content`, `kbd`, `mode`, `position`, `followCursor`, `interactive`, `maxWidth`, `gap`, `edgePadding`, `boundarySelector`) along with `cursorPoint`, `ownerId` and `getAnchorRect`. `updateVisibleTooltip` takes the same fields and `anchorRect`.

**Example: tooltips on a `<canvas>`**

```svelte
<script lang="ts">
  import { showTooltip, hideTooltip } from 'tipsy';

  function onMouseMove(event: MouseEvent) {
    const cell = pickCell(event);
    if (cell) showTooltip({ text: cell.label, position: 'top' }, cell.rect);
  }
</script>

<canvas onmousemove={onMouseMove} onmouseleave={() => hideTooltip()}></canvas>
```

A rect is `{ top, bottom, left, right, width, height }` in viewport coordinates, the shape `getBoundingClientRect()` returns.

---

## Recipes

### Turn tooltips off

```ts
configureTipsy({ enabled: !userPrefs.hideTooltips });
```

To tie tooltips to a delay setting where `0` means off:

```ts
configureTipsy({
  getDelay: () => userPrefs.tooltipDelay,
  disableWhenDefaultDelayIsZero: true,
});
```

Anchors with their own `delay: 0` still show, which suits shortcut hints you never want users to lose.

### Custom anchor rect

For anchors whose visual bounds differ from the element's, such as an icon inside a larger hit target:

```svelte
<button
  use:tooltip={{
    text: 'Edit',
    getRect: (node) => node.querySelector('.icon')!.getBoundingClientRect(),
  }}
>
  <span class="icon">✎</span>
</button>
```

### Moving anchors

An anchor is measured again on every frame while its tooltip shows, so a draggable element keeps its tooltip attached. `hideOnPress: false` keeps it showing while you drag:

```svelte
<div class="draggable" use:tooltip={{ text: 'Drag me', boundarySelector: '#canvas', hideOnPress: false }}>drag</div>
```

For a virtual anchor, pass `getAnchorRect` and the portal reads it each frame:

```ts
showTooltip({ text: cell.label, getAnchorRect: () => getCellRect(cell.id) }, getCellRect(cell.id));
```

### Manual control with `show`

```svelte
<input
  bind:value
  use:tooltip={{ text: 'That email looks off', mode: 'error', trigger: 'manual', show: blurred && !isValid }}
/>
```

### Click to pin a hover preview

```svelte
<button use:tooltip={{ content: details, trigger: ['hover', 'click'], interactive: true }}>
  Details
</button>
```

The preview shows on hover after the delay. A click pins it, so leaving the anchor no longer hides it. Another click, or a press anywhere else, dismisses it.

---

## Placement details

The placement engine is exported as `placeTooltip` for canvas tooltips, charts and tests. It:

1. Measures the room on each side of the anchor, less `gap` and `edgePadding`.
2. Scores each side: a bonus for fitting, a bonus for being the preferred side, more for spare room, less for spilling past the boundary.
3. Places the bubble on the highest-scoring side and keeps it inside the boundary.
4. Centers the bubble on the cursor when **no** side fits and a `cursorPoint` is known (`strategy: 'cursor'`).

```ts
import { placeTooltip, getTooltipBoundaryRect } from 'tipsy';

const result = placeTooltip({
  anchorRect,
  bounds: getTooltipBoundaryRect('#scope'),
  cursorPoint: { x: 100, y: 200 },
  preferredPosition: 'top',
  tooltipSize: { width: 180, height: 32 },
});
// → { left, top, position, transformOrigin, maxWidth, maxHeight, strategy }
```

---

## TypeScript

Every type is exported:

```ts
import type {
  // Action
  TooltipConfig,
  TooltipInput,
  // Global config
  TipsyRuntimeConfig,
  ConfigureTipsyOptions,
  Trigger,
  ThemeConfig,
  ModeStyle,
  KbdTheme,
  AnimationConfig,
  Easing,
  EasingPreset,
  // Store
  TooltipMode,
  TooltipState,
  TooltipShowOptions,
  VisibleTooltipPatch,
  // Placement
  TooltipPosition,
  TooltipRect,
  TooltipBounds,
  TooltipPoint,
  TooltipSize,
  TooltipPlacementRequest,
  TooltipPlacementResult,
} from 'tipsy';
```

Two constants come with them: `TRIGGERS`, the list of trigger names, and `TIPSY_BUBBLE_ID`, the bubble's element id.

---

## Accessibility

- The bubble has `role="tooltip"` and a stable id, `tipsy-bubble`.
- The action points the anchor's `aria-describedby` at the bubble while its tooltip shows, alongside any value the anchor already had, and restores that value afterward.
- Keyboard focus shows the tooltip through the `'focus'` trigger.
- A press anywhere, the window losing focus, the tab being hidden and the pointer leaving the page all dismiss the tooltip. A press inside a `'click'` anchor, the bubble itself, or a showing anchor with `hideOnPress: false` does not.

---

## SSR

Safe to import. Actions do not run on the server, and the portal renders nothing until a tooltip shows.

---

## What's intentionally _not_ here

- **Several tooltips at once.** One global bubble by design.
- **HTML strings.** Use snippets for rich content.
- **Long-press triggers.** On touch screens, tooltips open by `click` or `show`.
- **An arrow.** The bubble is a flat slab.

If you need any of these, try [Floating UI](https://floating-ui.com/) or [Bits UI](https://bits-ui.com/).

---

## Development

The library is the six files in `src/`. The demo site in `site/` imports them directly, so it doubles as the playground:

```bash
npm install                                # once
npx playwright install --only-shell chromium   # once, for the tests
npm run dev                                # the demo site
npm test                                   # the test suite
npm run check                              # type-check the library, the tests and the site
```

The tests in `test/` run in real Chromium through Vitest's browser mode, so layout, focus and event order are the browser's own. Tipsy's delays run on a clock the tests move by hand, so no result depends on how fast the machine is.

---

## License

[MIT](LICENSE)
