<script lang="ts">
  import { onMount } from 'svelte';
  import { sections } from '../sections';

  let active = $state(sections[0].id);
  let innerEl = $state<HTMLElement | null>(null);
  let listEl = $state<HTMLUListElement | null>(null);
  let positioned = $state(false);

  let indicatorTop = $state(0);
  let indicatorHeight = $state(0);
  let indicatorReady = $state(false);

  function measureIndicator() {
    if (!listEl) return;
    const activeLink = listEl.querySelector<HTMLElement>('a.active');
    if (!activeLink) return;
    indicatorTop = activeLink.offsetTop;
    indicatorHeight = activeLink.offsetHeight;
    indicatorReady = true;
  }

  $effect(() => {
    void active;
    queueMicrotask(measureIndicator);
  });

  onMount(() => {
    const sectionEls = sections.map(({ id }) => document.getElementById(id)!);
    const firstSection = sectionEls[0];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) active = visible[0].target.id;
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      },
    );
    for (const el of sectionEls) observer.observe(el);

    // The nav sticks centered in the viewport, and starts centered beside the first section.
    function compute() {
      if (!innerEl) return;
      const navH = innerEl.offsetHeight;

      const minTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) + 24;
      const stickyTop = Math.max(minTop, (window.innerHeight - navH) / 2);
      const startOffset = Math.max(0, (firstSection.getBoundingClientRect().height - navH) / 2);

      document.documentElement.style.setProperty('--sidenav-top', `${stickyTop}px`);
      document.documentElement.style.setProperty('--sidenav-start-offset', `${startOffset}px`);
      positioned = true;
      measureIndicator();
    }

    let raf = 0;
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    }

    compute();
    const ro = new ResizeObserver(schedule);
    if (innerEl) ro.observe(innerEl);
    ro.observe(firstSection);
    window.addEventListener('resize', schedule);

    // Web fonts change the link heights once they swap in.
    document.fonts.ready.then(measureIndicator);

    return () => {
      observer.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  });

  function jump(e: MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }
</script>

<aside aria-label="Section navigation" class:positioned>
  <div class="inner" bind:this={innerEl}>
    <span class="label">
      <span class="label-line"></span>
      Contents
    </span>
    <ul bind:this={listEl}>
      <span
        class="indicator"
        class:ready={indicatorReady}
        style="--top: {indicatorTop}px; --h: {indicatorHeight}px;"
        aria-hidden="true"
      ></span>
      {#each sections as { id, label }, i (id)}
        <li>
          <a href={`#${id}`} class:active={active === id} onclick={(e) => jump(e, id)}>
            <span class="num">{String(i + 1).padStart(2, '0')}</span>
            <span class="text">{label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </div>
</aside>

<style>
  aside {
    grid-area: side;
    align-self: start;
    position: sticky;
    top: var(--sidenav-top, 80px);
    width: var(--sidenav-w);
    margin-top: var(--sidenav-start-offset, 0px);
    opacity: 0;
  }

  aside.positioned {
    opacity: 1;
  }

  .inner {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .label {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-mute);
    padding-left: 18px;
  }

  .label-line {
    width: 14px;
    height: 1px;
    background: var(--ink-faint);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  ul::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--line);
  }

  .indicator {
    position: absolute;
    left: -1px;
    top: var(--top, 0);
    width: 2px;
    height: var(--h, 0);
    background: var(--accent);
    border-radius: 1px;
    opacity: 0;
    transform: scaleY(0.6);
    transform-origin: center;
    transition:
      top 380ms cubic-bezier(0.65, 0, 0.2, 1),
      height 380ms cubic-bezier(0.65, 0, 0.2, 1),
      opacity 200ms ease,
      transform 380ms cubic-bezier(0.65, 0, 0.2, 1);
    pointer-events: none;
  }

  .indicator.ready {
    opacity: 1;
    transform: scaleY(1);
  }

  li {
    margin: 0;
  }

  a {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 9px 18px 9px 18px;
    color: var(--ink-mute);
    font-size: 13.5px;
    font-weight: 500;
    letter-spacing: -0.005em;
    transition: color 200ms ease;
  }
  a:hover {
    color: var(--ink-soft);
    text-decoration: none;
  }
  a.active {
    color: var(--ink);
  }

  .num {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--ink-faint);
    letter-spacing: 0.04em;
    transition: color 200ms ease;
    flex-shrink: 0;
    min-width: 16px;
  }
  a:hover .num {
    color: var(--ink-mute);
  }
  a.active .num {
    color: var(--accent);
  }

  .text {
    transition: color 200ms ease, font-weight 0ms;
  }

  a.active .text {
    font-weight: 600;
    color: var(--ink);
  }

  @media (max-width: 900px) {
    aside {
      display: none;
    }
  }
</style>
