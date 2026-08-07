import type { ReactNode } from "react";

export type TLinePrefixProps = {
  readonly lineNumber: number;
  readonly totalLines: number;
  readonly isActiveLine: boolean;
  readonly isVirtualLine: boolean;
  readonly isContinuationLine: boolean;
  readonly continuationIndex: number;
  readonly isLastChunkOfLine: boolean;
};

export type TLinePrefixFn = (props: TLinePrefixProps) => ReactNode;

// A suffix is decorated with the same per-line information as a prefix.
export type TLineSuffixProps = TLinePrefixProps;

export type TLineSuffixFn = (props: TLineSuffixProps) => ReactNode;

export type TShowInvisibles =
  | boolean
  | {
      readonly space?: boolean;
      readonly tab?: boolean;
      readonly newline?: boolean;
    };

export type TStyleProps = {
  readonly color?: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly strikethrough?: boolean;
  readonly dim?: boolean;
  readonly inverse?: boolean;
  readonly bgColor?: string;
};

// A function-driven ("dynamic") label style. `fn` is called once per
// grapheme of a labeled run and returns the style for that grapheme.
export type TStyleFnContext<TMeta = unknown> = {
  readonly label: string;
  // Grapheme index measured from the 0th grapheme of the label run.
  readonly index: number;
  // Total grapheme count of the label run.
  readonly length: number;
  // Per-occurrence state, seeded from `initialMeta`.
  readonly meta: TMeta;
};
export type TStyleFnResult<TMeta = unknown> = TStyleProps & {
  // When set (ms), the run re-renders after this delay.
  readonly nextAfter?: number;
  // When set, becomes `meta` on the next call for this run.
  readonly nextMeta?: TMeta;
};
export type TStyleFn<TMeta = unknown> = (
  ctx: TStyleFnContext<TMeta>,
) => TStyleFnResult<TMeta> | undefined | null | false;
// PERFORMANCE CAVEAT: an dynamic label renders one <Text> node per grapheme
// of its matched runs (instead of one coalesced <Text> per run) and drives a
// timer-based re-render loop. Use it sparingly — reserve it for short,
// deliberately dynamic spans (e.g. a slash-command), not large bodies of
// text. Static `TStyleProps` labels have no such cost.
export type TDynamicStyle<TMeta = unknown> = {
  readonly fn: TStyleFn<TMeta>;
  readonly initialMeta?: TMeta;
};

export type TStyles = {
  readonly text?: TStyleProps;
  readonly invisibleCharacter?: TStyleProps;
  // `any` (not `unknown`) so a label can carry a TDynamicStyle with a
  // concrete meta type; `fn` is contravariant in meta, so `unknown` here
  // would reject every specifically-typed dynamic style.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [labelName: string]: TStyleProps | TDynamicStyle<any> | undefined;
};

export type TLabelFn = (match: RegExpMatchArray) => string | undefined;
export type TLabelRule = {
  readonly pattern: RegExp;
  readonly label: string | TLabelFn;
};
export type TLabels = readonly TLabelRule[];

export type TKeybinding =
  | "Enter"
  | "Ctrl+J"
  | "Ctrl+Enter"
  | "Shift+Enter"
  | "Alt+Enter"
  | "Up"
  | "Down"
  | "Left"
  | "Right"
  | "Alt+B"
  | "Alt+F"
  | "Ctrl+A"
  | "Ctrl+E"
  | "Ctrl+W"
  | "Ctrl+U"
  | "Ctrl+K"
  | "Backspace"
  | "Delete"
  | "Alt+Backspace"
  | "Ctrl+Z"
  | "Ctrl+Y";

export type TKeybindings = Partial<Readonly<Record<TKeybinding, boolean>>>;

export type TextAreaHandle = {
  readonly insert: (text: string) => void;
};

export type TextAreaProps = {
  readonly focus: boolean;
  readonly onSubmit: (value: string) => void;
  readonly placeholder?: string;
  readonly linePrefix?: ReactNode | TLinePrefixFn;
  readonly lineSuffix?: ReactNode | TLineSuffixFn;
  readonly cursorInterval?: number;
  readonly typingPause?: number;
  readonly maxUndo?: number;
  readonly undoGroupDelay?: number;
  readonly autoNewLineLimit?: number;
  readonly highlightActiveLine?: boolean;
  readonly activeLineColor?: string;
  readonly disableArrowNavigation?: boolean;
  readonly disableCursorBlink?: boolean;
  // Controlled mode props
  readonly value?: string;
  readonly cursorPosition?: [line: number, col: number];
  readonly onChange?: (value: string) => void;
  readonly onCursorChange?: (
    position: [line: number, col: number],
    type: string,
    chunkIndex: number,
  ) => void;
  // Boundary navigation handlers
  readonly onFirstLineUp?: () => void;
  readonly onLastLineDown?: () => void;
  readonly onFirstCharacterLeft?: () => void;
  readonly onLastCharacterRight?: () => void;
  readonly onTab?: (shift: boolean) => void;
  // Initial line count
  readonly initialLineCount?: number;
  // Maximum number of visual rows to render at once. When set, the textarea
  // virtualizes rendering by slicing visualRows around the cursor and
  // auto-scrolling to keep the cursor visible. Defaults to no cap (renders
  // every row).
  readonly viewportLines?: number;
  readonly tabWidth?: number;
  readonly onDimensions?: (width: number) => void;
  readonly showInvisibles?: TShowInvisibles;
  readonly styles?: TStyles;
  readonly labels?: TLabels;
  readonly keybindings?: TKeybindings;
};
