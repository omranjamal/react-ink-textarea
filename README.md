# ink-textarea

> A multiline textarea component for [Ink](https://github.com/vadimdemedes/ink)

Build rich CLI forms with a full-featured textarea that supports multi-line editing, cursor navigation, undo, and customizable line prefixes.

## Features

- 🎨 **Visuals & polish**
  - Blinking inverse-video cursor; pauses on type, resumes after a quiet window.
  - Active-line highlight (`highlightActiveLine`, `activeLineColor`).
  - Visible whitespace glyphs — `·` `→` `↵` (toggle per glyph via `showInvisibles`).
  - Dim multi-line placeholder; vanishes on first keystroke.
  - `initialLineCount` pads short buffers with virtual rows.
- 🪪 **Custom gutters**
  - `linePrefix` render-prop with `lineNumber`, `totalLines`, `isActiveLine`, `isVirtualLine`, `isContinuationLine`, `continuationIndex`.
  - Bundled `<LineNumber />` component with active-color, pad char, suffix.
- 🌈 **Syntax highlighting & theming**
  - Regex-driven labels: `labels: [{ pattern, label }]`.
  - Function-form labels for veto / allowlist (`label: match => string | undefined`).
  - Multiple rules → same label; first rule wins on overlap.
  - Per-label `styles`: `color`, `bgColor`, `bold`, `italic`, `underline`, `strikethrough`, `dim`, `inverse`. Hex + named ANSI.
  - Reserved style keys `text` and `invisibleCharacter`, deep-merged over defaults.
  - `onCursorChange` reports the label and chunk index under the cursor.
- ⌨️ **Editing**
  - Readline-style: `Ctrl+A`/`Ctrl+E`, `Alt+B`/`Alt+F`, `Ctrl+W`, `Alt+Backspace`, `Ctrl+U`, `Ctrl+K`, `Ctrl+Z`.
  - `Enter` submits; `Ctrl+J` / `Shift+Enter` / `Alt+Enter` / `Ctrl+Enter` insert newline.
  - `Tab` is a callback (`onTab(shift)`), not a forced insert.
  - Grouped undo with `undoGroupDelay` + `maxUndo`; pastes are one step.
  - Bracketed paste via Ink's paste channel, normalized to LF.
- 🌐 **Unicode-correct**
  - Grapheme-aware cursor: emoji, ZWJ families (👨‍👩‍👧), flags, surrogate pairs, combining marks. Powered by `Intl.Segmenter`.
  - Visual-width layout (CJK = 2, ZW = 0) via `string-width` — wrapping, columns, all of it.
  - Tab expansion at `tabWidth` (default 4), no fake spaces.
  - CRLF / CR normalized to LF on paste and controlled values.
- 📐 **Layout & viewport**
  - Visual-width line wrapping; continuations flagged in `linePrefix` props.
  - Built-in virtualization via `viewportLines`; defaults to `floor(stdout.rows * 0.5)` so blink-rerenders don't scroll-jank tall buffers.
  - Auto-scroll keeps cursor visible.
  - Resize-aware (listens to `stdout` resize).
  - Hot ASCII path for the common case.
- 🧭 **Navigation hooks**
  - `onFirstLineUp`, `onLastLineDown`, `onFirstCharacterLeft`, `onLastCharacterRight` — strict ends only, perfect for forwarding focus.
  - `autoNewLineLimit` caps trailing blank lines `↓` will create.
  - `disableArrowNavigation` opt-out (default `false`) when a parent owns navigation.
  - `keybindings: Partial<Record<TKeybinding, boolean>>` — disable individual chords (`Ctrl+Z`, `Shift+Enter`, etc.) without losing the rest.
- ⚛️ **React API**
  - Controlled, uncontrolled, or mixed (`value` + `cursorPosition` optional).
  - Out-of-bounds cursor clamped, reported via `onCursorChange` — no desync.
  - Callbacks: `onChange`, `onSubmit`, `onCursorChange`, `onDimensions`, `onTab`, plus boundary callbacks.
  - `isActive` makes it read-only without unmounting.
- 🧷 **TypeScript**
  - Strict, all props `readonly`.
  - Exports: `TextAreaProps`, `TLinePrefixProps`, `TLinePrefixFn`, `TShowInvisibles`, `TStyleProps`, `TStyles`, `TLabels`, `TLabelRule`, `TLabelFn`, `LineNumberProps`.
  - Render-prop and label-fn signatures fully inferred.
- 🧪 **Testable**
  - Works with [`ink-testing-library`](https://github.com/vadimdemedes/ink-testing-library); 250+ tests in-repo as a pattern bank.

## Install

```bash
npm install ink-textarea
# or
yarn add ink-textarea
# or
pnpm add ink-textarea
```

## Usage

### Basic

```tsx
import { render } from "ink";
import { useState } from "react";
import { TextArea } from "ink-textarea";

const App = () => {
  const [submitted, setSubmitted] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (value: string) => {
    setSubmitted(value);
    setIsActive(false);
  };

  return (
    <TextArea
      isActive={isActive}
      onSubmit={handleSubmit}
      placeholder="Type your message here..."
    />
  );
};

render(<App />);
```

### With Line Prefix

Render line numbers, borders, or any custom prefix before each line:

```tsx
import { TextArea, LineNumber } from "ink-textarea";

<TextArea
  isActive={true}
  onSubmit={(value) => console.log(value)}
  placeholder="Write some code..."
  highlightActiveLine={true}
  linePrefix={({ lineNumber, totalLines, isActiveLine }) => (
    <Text>
      <Text color="gray">│ </Text>
      <LineNumber
        lineNumber={lineNumber}
        totalLines={totalLines}
        isActive={isActiveLine}
      />
      <Text color="gray"> │ </Text>
    </Text>
  )}
/>;
```

### Line Number Component

The `LineNumber` component is exported for reuse:

```tsx
import { LineNumber } from "ink-textarea";

// Active line (highlighted)
<LineNumber lineNumber={0} totalLines={10} isActive={true} />

// Inactive line
<LineNumber lineNumber={1} totalLines={10} isActive={false} />
```

## Props

| Prop                    | Type                                                                                        | Description                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `isActive`              | `boolean`                                                                                   | Whether the textarea is focused and receiving keyboard input.                                                                             |
| `onSubmit`              | `(value: string) => void`                                                                   | Called when the user presses **Enter**. Receives the full text.                                                                           |
| `placeholder`           | `string`                                                                                    | Placeholder text shown when the textarea is empty.                                                                                        |
| `linePrefix`            | `ReactNode \| (props: TLinePrefixProps) => ReactNode`                                       | Optional prefix rendered before each line. The function form receives `{ lineNumber, totalLines, isActiveLine, isVirtualLine, isContinuationLine, continuationIndex }`. Use for line numbers, gutters, borders, etc. |
| `highlightActiveLine`   | `boolean`                                                                                   | When `true`, the active line is highlighted with a subtle background color. Defaults to `false`.                                          |
| `activeLineColor`       | `string`                                                                                    | Background color for the active line highlight. Defaults to no color.                                                                     |
| `cursorInterval`        | `number`                                                                                    | Cursor blink interval in milliseconds. Defaults to `500`.                                                                                 |
| `typingPause`           | `number`                                                                                    | Milliseconds to wait after typing before resuming cursor blink. Defaults to `450`.                                                        |
| `maxUndo`               | `number`                                                                                    | Maximum number of undo steps to retain. Defaults to `128`.                                                                                |
| `undoGroupDelay`        | `number`                                                                                    | Milliseconds to group consecutive edits into a single undo step. Defaults to `2500`.                                                      |
| `autoNewLineLimit`      | `number`                                                                                    | Maximum number of empty lines allowed after the last line with content. Only applies to Down arrow navigation. Defaults to `3`.           |
| `disableArrowNavigation` | `boolean`                                                                                  | When `true`, disables cursor movement via arrow keys (and word/line jumps). Useful for implementing suggestion pickers. Defaults to `false`.                    |
| `keybindings`           | `Partial<Record<TKeybinding, boolean>>`                                                     | Per-chord enable/disable map. Merged over defaults (all `true`). Set a chord to `false` to swallow it. `disableArrowNavigation: true` additionally forces all nav chords off. See **Keybinding Toggles** below.        |
| `initialLineCount`      | `number`                                                                                    | Number of lines to display initially. The textarea will maintain at least this many lines. Defaults to `2`.                               |
| `viewportLines`         | `number`                                                                                    | Maximum number of visual rows rendered at once. The textarea virtualizes rendering and auto-scrolls to keep the cursor visible. Defaults to `floor(stdout.rows * 0.5)` so blink re-renders don't scroll-jank tall buffers when the frame exceeds the terminal viewport. Pass an explicit number to override; `Infinity` renders every row. |
| `tabWidth`              | `number`                                                                                    | Visual width of `\t` characters in cells. Tabs render as `tabWidth` spaces (or `→` + spaces with `showInvisibles.tab`). The stored value keeps `\t`. Defaults to `4`. |
| `value`                 | `string`                                                                                    | **Controlled mode**: The current value of the textarea. When provided, component operates in controlled mode.                             |
| `cursorPosition`        | `[line: number, column: number]`                                                            | **Controlled mode**: The current cursor position as a `[line, column]` tuple. Use with `value` for full control.                          |
| `onChange`              | `(value: string) => void`                                                                   | **Controlled mode**: Called when the value changes.                                                                                       |
| `onCursorChange`        | `(position: [line, column], type: string, chunkIndex: number) => void`                      | **Controlled mode**: Called when the cursor moves. `type` is the label at the cursor (`"text"` if no label matches); `chunkIndex` is the zero-based index of the labeled segment the cursor is in. |
| `onFirstLineUp`         | `() => void`                                                                                | Called when Up arrow is pressed on the first visual row. Useful for moving focus out of the textarea.                                     |
| `onLastLineDown`        | `() => void`                                                                                | Called when Down arrow is pressed on the last line and trailing-empty-line limit is reached. Useful for moving focus out.                 |
| `onFirstCharacterLeft`  | `() => void`                                                                                | Called when Left arrow is pressed at the very start of the value (`cursor === 0`). Useful for moving focus to a previous field.            |
| `onLastCharacterRight`  | `() => void`                                                                                | Called when Right arrow is pressed at the very end of the value (`cursor === value.length`). Useful for moving focus to a next field.       |
| `onTab`                 | `(shift: boolean) => void`                                                                  | Called when Tab is pressed. `shift` is `true` for Shift+Tab. Without this prop, Tab is silently swallowed (no value mutation).            |
| `onDimensions`          | `(width: number) => void`                                                                   | Called with the measured content width whenever it changes.                                                                               |
| `showInvisibles`        | `boolean \| { space?: boolean; tab?: boolean; newline?: boolean }`                          | Render whitespace glyphs (`·` for space, `→` for tab, `↵` for newline). Defaults to `false`.                                              |
| `styles`                | `{ text?, invisibleCharacter?, [labelName]? }` of `TStyleProps`                             | Style overrides for the default text run, invisible glyphs, and any user-defined labels.                                                  |
| `labels`                | `readonly { pattern: RegExp; label: string \| ((match: RegExpMatchArray) => string \| undefined) }[]` | Array of label rules. Each rule's `pattern` is matched against the value; matches receive the rule's `label`. Use a function form to allowlist matches — return `undefined` to leave a match unlabeled. First rule wins on overlap. |

### Controlled Mode

Use controlled mode when you need to manage the textarea state externally:

```tsx
const [value, setValue] = useState("");
const [cursor, setCursor] = useState<[number, number]>([0, 0]);

<TextArea
  isActive={true}
  value={value}
  cursorPosition={cursor}
  onChange={setValue}
  onCursorChange={(pos) => setCursor(pos)}
  onSubmit={(val) => console.log(val)}
/>;
```

## Keybindings

| Key             | Action                         |
| --------------- | ------------------------------ |
| `Ctrl+J`        | Insert newline                 |
| `Ctrl+Enter`    | Insert newline                 |
| `Shift+Enter`   | Insert newline                 |
| `Alt+Enter`     | Insert newline (Option+Enter)  |
| `Enter`         | Submit                         |
| `↑` / `↓`       | Move cursor between lines      |
| `←` / `→`       | Move cursor left / right       |
| `Opt+←`         | Jump to previous word          |
| `Opt+→`         | Jump to next word              |
| `Ctrl+A`        | Start of current line          |
| `Ctrl+E`        | End of current line            |
| `Ctrl+W`        | Delete word before cursor      |
| `Ctrl+U`        | Delete to start of line        |
| `Ctrl+K`        | Delete to end of line          |
| `Backspace`     | Delete character before cursor |
| `Delete`        | Delete character before cursor (same as `Backspace`) |
| `Opt+Backspace` | Delete word before cursor      |
| `Ctrl+Z`        | Undo (up to 128 steps)         |

> On macOS, `Alt` chords are pressed via the **Option** (`⌥`) key.

### Keybinding Toggles

Pass a `keybindings` map to disable individual chords. Keys are the chord strings themselves; values are `true` (enabled) or `false` (disabled). Anything you don't list defaults to enabled.

```tsx
<TextArea
  isActive
  onSubmit={onSubmit}
  keybindings={{
    "Ctrl+Z": false,      // disable undo
    "Shift+Enter": false, // disable Shift+Enter newline (other newline chords still work)
    "Alt+B": false,       // disable previous-word jump
  }}
/>
```

The full chord catalog (every key is a `TKeybinding`):

| Chord            | Action                            |
| ---------------- | --------------------------------- |
| `Enter`          | Submit                            |
| `Ctrl+J`         | Insert newline                    |
| `Ctrl+Enter`     | Insert newline                    |
| `Shift+Enter`    | Insert newline                    |
| `Alt+Enter`      | Insert newline                    |
| `Up`             | Cursor up                         |
| `Down`           | Cursor down                       |
| `Left`           | Cursor left                       |
| `Right`          | Cursor right                      |
| `Alt+B`          | Previous word                     |
| `Alt+F`          | Next word                         |
| `Ctrl+A`         | Start of line                     |
| `Ctrl+E`         | End of line                       |
| `Ctrl+W`         | Delete word before cursor         |
| `Ctrl+U`         | Delete to start of line           |
| `Ctrl+K`         | Delete to end of line             |
| `Backspace`      | Delete grapheme before cursor     |
| `Delete`         | Delete grapheme before cursor     |
| `Alt+Backspace`  | Delete word before cursor         |
| `Ctrl+Z`         | Undo                              |

`disableArrowNavigation: true` additionally forces all nav chords (`Up`, `Down`, `Left`, `Right`, `Alt+B`, `Alt+F`, `Ctrl+A`, `Ctrl+E`) off regardless of the map.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Watch mode
pnpm run dev

# Run tests
pnpm test

# Format code
pnpm run format
```

## License

MIT
