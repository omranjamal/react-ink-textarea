# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `lineSuffix` render-prop — the right-side mirror of `linePrefix`, for per-line context
  information (char/token counts, git blame, status badges) pinned to the right edge. Accepts
  a `ReactNode` or a `(props: TLineSuffixProps) => ReactNode` render prop.
- `isLastChunkOfLine` on `TLinePrefixProps` (and thus `TLineSuffixProps`) so a decoration can
  render once per logical line instead of on every wrapped row.
