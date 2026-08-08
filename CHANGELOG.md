# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
