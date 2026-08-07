# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Dynamic (function-driven) label styles. A `styles` entry may be a
  `{ fn, initialMeta? }` object instead of a static `TStyleProps`; `fn` is
  called per grapheme of a labeled run with `{ label, index, length, meta }` and
  returns that grapheme's style. Returning `nextAfter` (ms, floored at 10) drives
  a re-render and `nextMeta` carries generic per-occurrence state, enabling
  animation (e.g. a rotating rainbow). Runs render one `<Text>` per grapheme and
  the timer loop runs only while focused. New exported types: `TDynamicStyle`,
  `TStyleFn`, `TStyleFnContext`, `TStyleFnResult`. Demonstrated by `/ultra` in
  the example. ([#15](https://github.com/omranjamal/react-ink-textarea/issues/15))

## [0.4.0] - 2026-08-07

### Added

- `lineSuffix` render-prop — the right-side mirror of `linePrefix`, for per-line context
  information (char/token counts, git blame, status badges) pinned to the right edge. Accepts
  a `ReactNode` or a `(props: TLineSuffixProps) => ReactNode` render prop.
- `isLastChunkOfLine` on `TLinePrefixProps` (and thus `TLineSuffixProps`) so a decoration can
  render once per logical line instead of on every wrapped row.

### Fixed

- Text wrapping now accounts for each **sub-row's** own `linePrefix`/`lineSuffix` width,
  measured per visual row, so a decoration whose width differs between lines — or between a
  line's first row and its wrapped continuations (e.g. a marker only on the caret's first
  sub-row) — wraps correctly, re-wrapping only the sub-rows it actually affects. Previously a
  single width, measured from the first visible row, was applied to every line. Rows outside
  `viewportLines` use a best-effort fallback width until scrolled in.
  ([#13](https://github.com/omranjamal/react-ink-textarea/issues/13))
