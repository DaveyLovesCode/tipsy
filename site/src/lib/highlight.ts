/** What a piece of code is, which decides its color. Plain text has no kind. */
export type TokenKind = 'api' | 'value' | 'comment' | 'dim';

export interface Token {
  text: string;
  kind?: TokenKind;
}

const TIPSY_API = ['TooltipPortal', 'configureTipsy', 'showTooltip', 'hideTooltip', 'updateVisibleTooltip', 'tooltip'];

// One alternative per kind, tried in this order at every position.
const PATTERN = new RegExp(
  [
    // Comments
    String.raw`(?<comment><!--[\s\S]*?-->|\/\/[^\n]*)`,
    // Strings and numbers
    String.raw`(?<value>'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\`(?:[^\`\\]|\\.)*\`|\b\d+(?:\.\d+)?\b)`,
    // Tipsy's own names, and not the "tooltip" inside `data-tooltip-boundary`
    String.raw`(?<api>(?<![-\w.])(?:use:)?(?:${TIPSY_API.join('|')})(?![-\w]))`,
    // Keywords, Svelte block tags and punctuation
    String.raw`(?<dim>\b(?:import|from|let|const|function|async|await|return|if)\b|(?<=\{)[#/@:]\w+|[{}()[\]<>/=;,:.])`,
  ].join('|'),
  'g',
);

/** Splits Svelte or TypeScript source into colored pieces. Joined back, the pieces are the source. */
export function highlight(code: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  for (const match of code.matchAll(PATTERN)) {
    if (match.index > index) tokens.push({ text: code.slice(index, match.index) });
    const groups = match.groups ?? {};
    const kind = (Object.keys(groups) as TokenKind[]).find((name) => groups[name] !== undefined);
    tokens.push({ text: match[0], kind });
    index = match.index + match[0].length;
  }

  if (index < code.length) tokens.push({ text: code.slice(index) });
  return tokens;
}
