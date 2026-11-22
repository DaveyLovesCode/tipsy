# tipsy site

The interactive demo site for `tipsy`. It imports the library through a Vite alias (`tipsy → ../src/index.ts`), so every demo runs against the real source. It shares the repository's one install, so run these from the repository root.

## Run it

```bash
npm install
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`).

## Check it

```bash
npm run check
```

Type-checks the site, the library and its tests together.

## Build a static bundle

```bash
npm run build
npx serve site/dist   # or any static server
```

The build emits to `site/dist/` with relative paths, so any static host is enough: no server-side rendering, no environment variables.

## Sections

The page is the list in `src/sections/index.ts`, top to bottom. The side nav reads the same list.

- Hero: what it is, the install command, and a first snippet with its two buttons live
- Quick start: minimal setup, code beside a live demo
- Triggers: hover, focus, click and manual
- Placement: four sides, and a draggable anchor inside a boundary
- Kbd chips: shortcut hints in the bubble
- Snippets: Svelte snippets as content
- Interactive: a bubble the cursor can enter
- Modes: default, error and warning, and a custom `success` mode
- Theming: five live presets, applied with `configureTipsy`
- Animation: sliders for duration, distance, scale and easing
- Manual: a copy confirmation driven by `trigger: 'manual'` and `show`
- Imperative: a canvas grid using `showTooltip` and `hideTooltip`

The footer repeats the install command.

## Look

The colors, type and radii are the custom properties at the top of `src/app.css`, one set per theme. The tooltips' own look is `tooltipThemes` in `src/lib/theme.svelte.ts`, applied with `configureTipsy`. A link with `?theme=dark` or `?theme=light` opens the page in that theme.

On a touch screen the site adds `click` to Tipsy's default trigger, in `src/App.svelte`, so a tap opens the demos.
