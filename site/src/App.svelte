<script lang="ts">
  import { configureTipsy, TooltipPortal } from 'tipsy';
  import Nav from './lib/Nav.svelte';
  import Hero from './lib/Hero.svelte';
  import SideNav from './lib/SideNav.svelte';
  import Footer from './lib/Footer.svelte';
  import { hovers } from './lib/pointer';
  import { theme, initTheme, tooltipAnimation, tooltipThemes } from './lib/theme.svelte';
  import { sections } from './sections';

  initTheme();

  // No delay, so every demo answers at once.
  configureTipsy({ defaultDelay: 0, animation: tooltipAnimation });

  // Hover and focus bind nothing on a touch screen, so there a tap opens the demos.
  if (!hovers) configureTipsy({ trigger: ['hover', 'focus', 'click'] });

  $effect(() => configureTipsy({ theme: tooltipThemes[theme.mode] }));
</script>

<Nav />

<Hero />

<div class="layout">
  <div class="layout-inner">
    <SideNav />
    <main class="content">
      {#each sections as { id, label, component: Section } (id)}
        <Section {id} {label} />
      {/each}
    </main>
  </div>
</div>

<Footer />

<TooltipPortal />

<style>
  .layout {
    width: 100%;
  }

  .layout-inner {
    width: 100%;
    max-width: var(--container);
    margin: 0 auto;
    padding-inline: var(--gutter);
    display: grid;
    grid-template-columns: var(--sidenav-w) 1fr;
    grid-template-areas: 'side content';
    gap: 56px;
  }

  .content {
    grid-area: content;
    min-width: 0;
    counter-reset: section;
  }

  @media (max-width: 900px) {
    .layout-inner {
      grid-template-columns: 1fr;
      grid-template-areas: 'content';
      gap: 0;
    }
  }
</style>
