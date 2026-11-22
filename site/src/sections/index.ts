import type { Component } from 'svelte';
import Animation from './Animation.svelte';
import Imperative from './Imperative.svelte';
import Interactive from './Interactive.svelte';
import Kbd from './Kbd.svelte';
import Manual from './Manual.svelte';
import Modes from './Modes.svelte';
import Placement from './Placement.svelte';
import QuickStart from './QuickStart.svelte';
import Snippets from './Snippets.svelte';
import Theming from './Theming.svelte';
import Triggers from './Triggers.svelte';

interface SectionEntry {
  /** The section's anchor, which the side nav links to. */
  id: string;
  /** Its name in the side nav. */
  label: string;
  component: Component<{ id: string; label: string }>;
}

/** The page, top to bottom. */
export const sections: SectionEntry[] = [
  { id: 'quick-start', label: 'Quick start', component: QuickStart },
  { id: 'triggers', label: 'Triggers', component: Triggers },
  { id: 'placement', label: 'Placement', component: Placement },
  { id: 'kbd', label: 'Kbd chips', component: Kbd },
  { id: 'snippets', label: 'Snippets', component: Snippets },
  { id: 'interactive', label: 'Interactive', component: Interactive },
  { id: 'modes', label: 'Modes', component: Modes },
  { id: 'theming', label: 'Theming', component: Theming },
  { id: 'animation', label: 'Animation', component: Animation },
  { id: 'manual', label: 'Manual', component: Manual },
  { id: 'imperative', label: 'Imperative', component: Imperative },
];
