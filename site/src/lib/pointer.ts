/**
 * False on touch screens. Tipsy binds nothing for `hover` and `focus` there, so the
 * site adds `click` to the default trigger and words its hints for a tap.
 */
export const hovers = !matchMedia('(hover: none)').matches;

/** The verb the hints use: "Hover" with a mouse, "Tap" without. */
export const pointVerb = hovers ? 'Hover' : 'Tap';
