import { Box, Text, useBoxMetrics, useStdout, measureElement } from "ink";
import type { DOMElement } from "ink";
import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useImperativeHandle,
} from "react";
import type { ReactNode, Ref } from "react";
import {
  DEFAULT_CURSOR_INTERVAL,
  DEFAULT_TYPING_PAUSE,
  DEFAULT_MAX_UNDO,
  DEFAULT_UNDO_GROUP_DELAY,
  DEFAULT_AUTO_NEW_LINE_LIMIT,
  DEFAULT_INITIAL_LINE_COUNT,
  DEFAULT_TAB_WIDTH,
  DEFAULT_KEYBINDINGS,
  NAV_KEYBINDINGS,
} from "./constants.js";
import {
  getCursorLineAndColumn,
  computeLabels,
  computeSegments,
  getLabelAt,
  findSegmentIndex,
  buildVisualRows,
  visualRowForCursor,
} from "./textUtils.js";
import { useCursorState } from "./hooks/useCursorState.js";
import { useUndo } from "./hooks/useUndo.js";
import { useCursorBlink } from "./hooks/useCursorBlink.js";
import { useKeyboardInput } from "./hooks/useKeyboardInput.js";
import { useViewport } from "./hooks/useViewport.js";
import type {
  TextAreaProps,
  TextAreaHandle,
  TLinePrefixProps,
  TStyleProps,
  TStyles,
  TKeybinding,
} from "./types.js";

type InvisiblesConfig = {
  readonly space: boolean;
  readonly tab: boolean;
  readonly newline: boolean;
};

type ResolvedStyles = {
  text: TStyleProps;
  invisibleCharacter: TStyleProps;
  byLabel: Record<string, TStyleProps>;
};

// Absolute backstop on non-converging per-line measurement passes before the
// layout is frozen (the value-based cycle detector normally catches loops much
// sooner). Kept well under React's own nested-update limit.
const MAX_MEASURE_PASSES = 24;

const DEFAULT_TEXT_STYLE: TStyleProps = {};
const DEFAULT_INVISIBLE_STYLE: TStyleProps = { color: "gray", dim: true };

const mergeStyleProps = (
  base: TStyleProps,
  override: TStyleProps | undefined,
): TStyleProps => ({ ...base, ...(override ?? {}) });

const resolveStyles = (input: TStyles | undefined): ResolvedStyles => {
  const byLabel: Record<string, TStyleProps> = {};
  if (input) {
    for (const [k, v] of Object.entries(input)) {
      if (k === "text" || k === "invisibleCharacter" || !v) continue;
      byLabel[k] = { ...v };
    }
  }
  return {
    text: mergeStyleProps(DEFAULT_TEXT_STYLE, input?.text),
    invisibleCharacter: mergeStyleProps(
      DEFAULT_INVISIBLE_STYLE,
      input?.invisibleCharacter,
    ),
    byLabel,
  };
};

const styleToTextProps = (s: TStyleProps) => ({
  color: s.color,
  bold: s.bold,
  italic: s.italic,
  underline: s.underline,
  strikethrough: s.strikethrough,
  dimColor: s.dim,
  inverse: s.inverse,
  backgroundColor: s.bgColor,
});

type RenderChunkBodyArgs = {
  chunk: string;
  chunkAbsStart: number;
  cursorPos: number;
  cursorVisible: boolean;
  isCursorAtLineEnd: boolean;
  inv: InvisiblesConfig;
  showAnyInvisible: boolean;
  invisibleProps: ReturnType<typeof styleToTextProps>;
  labelByChar: string[];
  labelTextProps: Record<string, ReturnType<typeof styleToTextProps>>;
  tabWidth: number;
};

const graphemeSegmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

const isAsciiOnly = (s: string): boolean => {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0x80 || c < 0x20) return false;
  }
  return true;
};

const renderRowBody = ({
  chunk,
  chunkAbsStart,
  cursorPos,
  cursorVisible,
  isCursorAtLineEnd,
  inv,
  showAnyInvisible,
  invisibleProps,
  labelByChar,
  labelTextProps,
  tabWidth,
}: RenderChunkBodyArgs): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let buf = "";
  let bufKey: string | null = null;
  let segIdx = 0;

  const propsForKey = (
    key: string,
  ): ReturnType<typeof styleToTextProps> | undefined => {
    const sep = key.indexOf("|");
    const label = key.slice(0, sep);
    const mode = key.slice(sep + 1);
    if (mode === "I") return invisibleProps;
    return label && label !== "text" ? labelTextProps[label] : undefined;
  };

  const flush = (): void => {
    if (buf.length === 0) return;
    const props = propsForKey(bufKey!);
    nodes.push(
      <Text key={`s${segIdx++}`} {...props}>
        {buf}
      </Text>,
    );
    buf = "";
    bufKey = null;
  };

  type Step = { unit: string; codeUnitOffset: number };
  const steps: Step[] = [];
  if (isAsciiOnly(chunk)) {
    for (let i = 0; i < chunk.length; i++) {
      steps.push({ unit: chunk[i]!, codeUnitOffset: i });
    }
  } else {
    for (const seg of graphemeSegmenter.segment(chunk)) {
      steps.push({ unit: seg.segment, codeUnitOffset: seg.index });
    }
  }

  for (const step of steps) {
    const g = step.unit;
    const i = step.codeUnitOffset;
    let isInv: boolean;
    let display: string;
    if (g === "\t") {
      if (showAnyInvisible && inv.tab) {
        display = "→" + " ".repeat(Math.max(0, tabWidth - 1));
        isInv = true;
      } else {
        display = " ".repeat(Math.max(1, tabWidth));
        isInv = false;
      }
    } else {
      isInv = showAnyInvisible && g === " " && inv.space;
      display = isInv ? "·" : g;
    }
    const charLabel = isInv ? "" : (labelByChar[chunkAbsStart + i] ?? "text");
    const isCur = i === cursorPos;
    const cellStr = isCur
      ? cursorVisible
        ? g === "\t"
          ? `\x1b[7m${display.charAt(0)}\x1b[27m${display.slice(1)}`
          : `\x1b[7m${display}\x1b[27m`
        : display === " " && isCursorAtLineEnd
          ? " "
          : display
      : display;
    const key = `${charLabel}|${isInv ? "I" : "T"}`;
    if (key !== bufKey) flush();
    bufKey = key;
    buf += cellStr;
  }

  if (cursorPos === chunk.length) {
    const cursorStr = cursorVisible ? "\x1b[7m \x1b[27m" : " ";
    const key = "text|T";
    if (key !== bufKey) flush();
    bufKey = key;
    buf += cursorStr;
  }

  flush();
  return nodes;
};

export const TextArea = ({
  ref,
  focus: isActive,
  onSubmit,
  placeholder,
  linePrefix,
  lineSuffix,
  cursorInterval = DEFAULT_CURSOR_INTERVAL,
  typingPause = DEFAULT_TYPING_PAUSE,
  maxUndo = DEFAULT_MAX_UNDO,
  undoGroupDelay = DEFAULT_UNDO_GROUP_DELAY,
  autoNewLineLimit = DEFAULT_AUTO_NEW_LINE_LIMIT,
  highlightActiveLine = false,
  activeLineColor = undefined,
  disableArrowNavigation = false,
  disableCursorBlink = false,
  value: controlledValue,
  cursorPosition: controlledPosition,
  onChange,
  onCursorChange,
  onFirstLineUp,
  onLastLineDown,
  onFirstCharacterLeft,
  onLastCharacterRight,
  onTab,
  initialLineCount = DEFAULT_INITIAL_LINE_COUNT,
  viewportLines,
  tabWidth = DEFAULT_TAB_WIDTH,
  onDimensions,
  showInvisibles = false,
  styles,
  labels,
  keybindings,
}: TextAreaProps & { readonly ref?: Ref<TextAreaHandle> }): ReactNode => {
  const resolvedKeybindings = useMemo<Readonly<Record<TKeybinding, boolean>>>(() => {
    const merged: Record<TKeybinding, boolean> = {
      ...DEFAULT_KEYBINDINGS,
      ...(keybindings ?? {}),
    };
    if (disableArrowNavigation === true) {
      for (const k of NAV_KEYBINDINGS) merged[k] = false;
    }
    return merged;
  }, [keybindings, disableArrowNavigation]);
  const resolvedStyles = useMemo(() => resolveStyles(styles), [styles]);
  const textProps = useMemo(
    () => styleToTextProps(resolvedStyles.text),
    [resolvedStyles.text],
  );
  const invisibleProps = useMemo(
    () => styleToTextProps(resolvedStyles.invisibleCharacter),
    [resolvedStyles.invisibleCharacter],
  );
  const labelTextProps = useMemo(() => {
    const out: Record<string, ReturnType<typeof styleToTextProps>> = {};
    for (const [k, v] of Object.entries(resolvedStyles.byLabel)) {
      out[k] = styleToTextProps(v);
    }
    return out;
  }, [resolvedStyles.byLabel]);
  const inv =
    typeof showInvisibles === "boolean"
      ? {
          space: showInvisibles,
          tab: showInvisibles,
          newline: showInvisibles,
        }
      : {
          space: !!showInvisibles.space,
          tab: !!showInvisibles.tab,
          newline: !!showInvisibles.newline,
        };
  const showAnyInvisible = inv.space || inv.tab || inv.newline;
  const dispatchCursorRef = useRef<
    ((cursor: number, valueForCalc?: string) => void) | null
  >(null);

  const { value, cursor, setValue, setCursor } = useCursorState({
    controlledValue,
    controlledPosition,
    onChange,
    onCursorAttempt: (newCursor, valueForCalc) => {
      dispatchCursorRef.current?.(newCursor, valueForCalc);
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      insert: (text: string) => {
        if (!text) return;
        const newValue = value.slice(0, cursor) + text + value.slice(cursor);
        setValue(newValue);
        setCursor(cursor + text.length, newValue);
      },
    }),
    [value, cursor, setValue, setCursor],
  );

  const lines = useMemo(() => value.split("\n"), [value]);

  const placeholderLines = useMemo(
    () => (placeholder ? placeholder.split("\n") : []),
    [placeholder],
  );

  const placeholderLineStartOffsets = useMemo(() => {
    const offsets: number[] = new Array(placeholderLines.length);
    let offset = 0;
    for (let i = 0; i < placeholderLines.length; i++) {
      offsets[i] = offset;
      offset += placeholderLines[i]!.length + 1;
    }
    return offsets;
  }, [placeholderLines]);

  const contentRef = useRef<DOMElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { width: measuredWidth } = useBoxMetrics(contentRef as any);
  const [lineWidth, setLineWidth] = useState(0);

  useEffect(() => {
    if (measuredWidth > 0) {
      setLineWidth((prev) => (prev === measuredWidth ? prev : measuredWidth));
    }
  }, [measuredWidth]);

  useEffect(() => {
    if (measuredWidth > 0) {
      onDimensions?.(measuredWidth);
    }
  }, [measuredWidth, onDimensions]);

  // Per-line content-box measurement. A line's content box is flexGrow={1}
  // between flexShrink={0} prefix/suffix boxes, so its width equals
  // container − prefix − suffix and is independent of how the text wraps
  // inside it. Measuring each visible line lets lines whose decoration width
  // differs wrap to their own width. Lines outside the viewport fall back to
  // `baseLineWidth` (the widest measured content box ≈ the least-decorated
  // line), and everything falls back to the single `lineWidth` measurement
  // before anything has been measured.
  //
  // Only engaged when a decoration exists; otherwise the single-width path is
  // used unchanged. Refs are stable per line index (never callback refs) so
  // they don't churn `useBoxMetrics` on the shared content box.
  const measurePerLine = linePrefix != null || lineSuffix != null;
  const chunkKey = (lineIdx: number, chunkIdx: number): string =>
    `${lineIdx}:${chunkIdx}`;
  const chunkRefs = useRef<Map<string, { current: DOMElement | null }>>(
    new Map(),
  );
  const getChunkRef = (
    lineIdx: number,
    chunkIdx: number,
  ): { current: DOMElement | null } => {
    const key = chunkKey(lineIdx, chunkIdx);
    let r = chunkRefs.current.get(key);
    if (!r) {
      r = { current: null };
      chunkRefs.current.set(key, r);
    }
    return r;
  };
  const [chunkWidths, setChunkWidths] = useState<Record<string, number>>({});
  const [baseLineWidth, setBaseLineWidth] = useState(0);
  // Guards the measurement effect against non-convergent feedback: when a
  // decoration's *width* depends on a wrapping-derived flag (e.g. a wider
  // gutter only on the active subline), measured width <-> wrapping can have no
  // fixed point and would otherwise re-render forever ("Maximum update depth").
  //
  // We detect that by value, not by render bookkeeping (which is unreliable
  // under concurrent rendering): if the exact set of widths we are about to
  // apply was already produced within the last few passes, we are cycling —
  // freeze on the current best-effort layout. A genuinely new layout (an edit,
  // resize, or animation frame) is never in the recent set, so it always
  // applies. `measureHardCapRef` is a final backstop for long cycles.
  const recentLayoutsRef = useRef<string[]>([]);
  const measureHardCapRef = useRef(0);

  const getChunkWidth = (lineIdx: number, chunkIdx: number): number => {
    if (!measurePerLine) return lineWidth;
    const w = chunkWidths[chunkKey(lineIdx, chunkIdx)];
    if (w != null && w > 0) return w;
    // Fallback for unmeasured/offscreen rows; 0 before first measurement
    // means "unwrapped" in buildVisualRows, matching prior behavior.
    return baseLineWidth > 0 ? baseLineWidth : lineWidth;
  };

  // Runs after every commit so any render that changes a decoration's width
  // (value edits, gutter-digit growth, active-line changes, resize) is caught
  // without a hand-maintained deps list. Convergence (or a change to the
  // external inputs) resets the pass budget; a run of non-converging passes is
  // capped so pathological width↔wrapping feedback cannot loop forever.
  // Passive (not layout) so measureElement reads the layout Ink has already
  // computed for this frame; a layout effect would read the previous frame's
  // sizes and never converge while widths are changing.
  useEffect(() => {
    if (!measurePerLine) {
      if (baseLineWidth !== 0) setBaseLineWidth(0);
      setChunkWidths((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }

    const next: Record<string, number> = {};
    let base = 0;
    for (const [key, ref] of chunkRefs.current) {
      const node = ref.current;
      if (!node) continue;
      const { width } = measureElement(node);
      if (width > 0) {
        next[key] = width;
        if (width > base) base = width;
      }
    }

    const baseChanged = base !== baseLineWidth;
    const nextKeys = Object.keys(next);
    const prevKeys = Object.keys(chunkWidths);
    const widthsChanged =
      prevKeys.length !== nextKeys.length ||
      !nextKeys.every((k) => chunkWidths[k] === next[k]);

    // Converged: nothing to do, and a settled layout forgets its history.
    if (!baseChanged && !widthsChanged) {
      recentLayoutsRef.current = [];
      measureHardCapRef.current = 0;
      return;
    }

    // Canonical signature of the layout we are about to apply.
    const sig =
      base +
      "|" +
      nextKeys
        .sort()
        .map((k) => k + ":" + next[k])
        .join(",");

    // Oscillation: this exact layout was produced within the recent window, or
    // a long cycle blew the hard cap. Freeze on the current best-effort layout.
    if (
      recentLayoutsRef.current.includes(sig) ||
      measureHardCapRef.current >= MAX_MEASURE_PASSES
    ) {
      return;
    }
    recentLayoutsRef.current.push(sig);
    if (recentLayoutsRef.current.length > 8) recentLayoutsRef.current.shift();
    measureHardCapRef.current += 1;

    if (baseChanged) setBaseLineWidth(base);
    if (widthsChanged) setChunkWidths(next);
  });

  const { pushUndo, undo, redo, resetMutationTracking } = useUndo({
    maxUndo,
    undoGroupDelay,
  });

  const { cursorVisible, resetBlink } = useCursorBlink({
    isActive,
    cursorInterval,
    typingPause,
    disableCursorBlink,
  });

  const { line: cursorLine, column: cursorColumn } = getCursorLineAndColumn(
    value,
    cursor,
  );

  const visualRows = useMemo(
    () =>
      buildVisualRows(
        lines,
        getChunkWidth,
        isActive ? cursorLine : -1,
        isActive ? cursorColumn : 0,
        initialLineCount,
        tabWidth,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      lines,
      lineWidth,
      chunkWidths,
      baseLineWidth,
      measurePerLine,
      isActive,
      cursorLine,
      cursorColumn,
      initialLineCount,
      tabWidth,
    ],
  );

  useKeyboardInput({
    isActive,
    value,
    cursor,
    keybindings: resolvedKeybindings,
    autoNewLineLimit,
    onSubmit,
    onFirstLineUp,
    onLastLineDown,
    onFirstCharacterLeft,
    onLastCharacterRight,
    onTab,
    setValue,
    setCursor,
    pushUndo,
    undo,
    redo,
    resetMutationTracking,
    resetBlink,
    lineWidth: getChunkWidth(cursorLine, 0),
    visualRows,
  });

  const totalLines = Math.max(lines.length, initialLineCount);
  const hasContent = value.length > 0;

  const labelByChar = useMemo(
    () => computeLabels(value, labels ?? []),
    [value, labels],
  );
  const segments = useMemo(() => computeSegments(labelByChar), [labelByChar]);

  const placeholderLabelByChar = useMemo(
    () => computeLabels(placeholder ?? "", labels ?? []),
    [placeholder, labels],
  );

  const renderPlaceholderLine = (
    lineText: string,
    absStart: number,
    keyPrefix: string,
  ): ReactNode[] => {
    if (lineText.length === 0) {
      return [
        <Text key={`${keyPrefix}-empty`} {...textProps} dimColor>
          {" "}
        </Text>,
      ];
    }
    const nodes: ReactNode[] = [];
    let buf = "";
    let bufLabel: string | null = null;
    let segCounter = 0;
    const flush = () => {
      if (buf.length > 0) {
        const lp =
          bufLabel !== null && bufLabel !== "text"
            ? labelTextProps[bufLabel]
            : undefined;
        nodes.push(
          <Text
            key={`${keyPrefix}-${segCounter++}`}
            {...textProps}
            {...lp}
            dimColor
          >
            {buf}
          </Text>,
        );
        buf = "";
        bufLabel = null;
      }
    };
    for (let i = 0; i < lineText.length; i++) {
      const charLabel = placeholderLabelByChar[absStart + i] ?? "text";
      if (bufLabel !== null && bufLabel !== charLabel) flush();
      buf += lineText[i];
      bufLabel = charLabel;
    }
    flush();
    return nodes;
  };

  const lastDispatchRef = useRef<{
    line: number;
    col: number;
    type: string;
    idx: number;
  } | null>(null);
  const prevCursorRef = useRef<number>(cursor);

  const dispatchCursor = (
    targetCursor: number,
    valueForCalc?: string,
  ): void => {
    if (!onCursorChange) return;
    const v = valueForCalc ?? value;
    const { line, column } = getCursorLineAndColumn(v, targetCursor);
    const type =
      targetCursor === 0 ? "text" : getLabelAt(labelByChar, targetCursor - 1);
    const idx =
      targetCursor === 0 ? 0 : findSegmentIndex(segments, targetCursor - 1);
    const last = lastDispatchRef.current;
    if (
      last !== null &&
      last.line === line &&
      last.col === column &&
      last.type === type &&
      last.idx === idx
    ) {
      return;
    }
    lastDispatchRef.current = { line, col: column, type, idx };
    onCursorChange([line, column], type, idx);
  };

  dispatchCursorRef.current = dispatchCursor;

  useEffect(() => {
    if (prevCursorRef.current !== cursor) {
      dispatchCursorRef.current?.(cursor);
    }
    prevCursorRef.current = cursor;
  }, [cursor]);

  const renderLine = (
    content: ReactNode,
    key: string | number,
    lineNumber: number,
    totalLinesArg: number,
    isVirtualLine: boolean,
    ref: { current: DOMElement | null } | undefined,
    isContinuationLine: boolean,
    continuationIndex: number,
    isActiveLine: boolean,
    isLastChunkOfLine: boolean,
  ): ReactNode => {
    const decorationProps: TLinePrefixProps = {
      lineNumber,
      totalLines: totalLinesArg,
      isActiveLine,
      isVirtualLine,
      isContinuationLine,
      continuationIndex,
      isLastChunkOfLine,
    };
    const prefix =
      typeof linePrefix === "function"
        ? linePrefix(decorationProps)
        : linePrefix;
    const suffix =
      typeof lineSuffix === "function"
        ? lineSuffix(decorationProps)
        : lineSuffix;

    const hasPrefix = !!prefix;
    const hasSuffix = !!suffix;
    const isHighlighted = highlightActiveLine && isActiveLine;

    // Content-box ref. In per-line mode each real (non-virtual) sub-row gets a
    // stable object ref keyed by (line, chunk) so measureElement can size each
    // sub-row independently; otherwise the shared `ref` drives useBoxMetrics
    // for the single-width path.
    const contentBoxRef =
      measurePerLine && !isVirtualLine
        ? getChunkRef(lineNumber, continuationIndex)
        : ref;

    // Fast path preserved for the common, undecorated case.
    if (!hasPrefix && !hasSuffix) {
      return (
        <Box
          key={key}
          width="100%"
          backgroundColor={isHighlighted ? activeLineColor : undefined}
        >
          <Box ref={contentBoxRef} flexGrow={1}>
            {content}
          </Box>
        </Box>
      );
    }

    return (
      <Box
        key={key}
        width="100%"
        flexDirection="row"
        backgroundColor={isHighlighted ? activeLineColor : undefined}
      >
        {hasPrefix ? <Box flexShrink={0}>{prefix}</Box> : null}
        <Box ref={contentBoxRef} flexGrow={1}>
          {content}
        </Box>
        {hasSuffix ? <Box flexShrink={0}>{suffix}</Box> : null}
      </Box>
    );
  };

  const cursorRowIndex = isActive
    ? visualRowForCursor(
        visualRows,
        cursorLine,
        cursorColumn,
        getChunkWidth(cursorLine, 0),
      )
    : -1;

  const { stdout } = useStdout();
  const [terminalRows, setTerminalRows] = useState<number>(stdout?.rows ?? 0);
  useEffect(() => {
    if (!stdout) return;
    const onResize = (): void => setTerminalRows(stdout.rows);
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);
  const resolvedViewportLines =
    viewportLines ??
    (terminalRows > 0
      ? Math.max(1, Math.floor(terminalRows * 0.5))
      : Number.POSITIVE_INFINITY);

  const { visibleRowStart, visibleRowEnd } = useViewport({
    rowCount: Math.max(visualRows.length, initialLineCount),
    viewportLines: resolvedViewportLines,
    cursorRowIndex,
  });

  if (value.length === 0 && !isActive && placeholderLines.length > 0) {
    const visibleCount = Math.max(0, visibleRowEnd - visibleRowStart);
    return (
      <Box flexDirection="column" width="100%">
        {Array.from({ length: visibleCount }, (_, k) => {
          const i = visibleRowStart + k;
          return renderLine(
            <Text>
              {renderPlaceholderLine(
                placeholderLines[i] ?? " ",
                placeholderLineStartOffsets[i] ?? 0,
                `ph-${i}`,
              )}
            </Text>,
            i,
            i,
            initialLineCount,
            i > 0,
            k === 0 ? contentRef : undefined,
            false,
            0,
            false,
            true,
          );
        })}
      </Box>
    );
  }

  if (value.length === 0 && isActive) {
    const visibleCount = Math.max(0, visibleRowEnd - visibleRowStart);
    return (
      <Box flexDirection="column" width="100%">
        {Array.from({ length: visibleCount }, (_, k) => {
          const i = visibleRowStart + k;
          const phLine = placeholderLines[i];
          const isCursorRow = i === cursorLine && cursorVisible;
          let content: ReactNode;
          if (phLine && phLine.length > 0) {
            const firstChar = phLine[0]!;
            const restOffset = (placeholderLineStartOffsets[i] ?? 0) + 1;
            const rest = phLine.slice(1);
            content = (
              <Text {...textProps}>
                {isCursorRow ? (
                  <Text key="cur">{`\x1b[7m${firstChar}\x1b[27m`}</Text>
                ) : (
                  renderPlaceholderLine(
                    firstChar,
                    placeholderLineStartOffsets[i] ?? 0,
                    `ph-${i}-h`,
                  )
                )}
                {rest.length > 0
                  ? renderPlaceholderLine(rest, restOffset, `ph-${i}-r`)
                  : null}
              </Text>
            );
          } else {
            content = (
              <Text {...textProps}>
                {isCursorRow ? "\x1b[7m \x1b[27m" : " "}
              </Text>
            );
          }
          return renderLine(
            content,
            i,
            i,
            initialLineCount,
            i > 0,
            k === 0 ? contentRef : undefined,
            false,
            0,
            isActive && i === cursorLine,
            true,
          );
        })}
      </Box>
    );
  }

  const renderedLines: ReactNode[] = [];

  // Locate the cursor's sub-row by chunk boundaries rather than by a uniform
  // width, since sub-rows of the same line can now have different widths.
  const cursorLineStartAbs = cursor - cursorColumn;
  let cursorChunkIdx = 0;
  let cursorPosInChunk = cursorColumn;
  if (isActive) {
    for (const r of visualRows) {
      if (r.isVirtualLine || r.lineIdx !== cursorLine) continue;
      const chunkStartCol = r.absStart - cursorLineStartAbs;
      if (chunkStartCol <= cursorColumn) {
        cursorChunkIdx = r.chunkIdx;
        cursorPosInChunk = cursorColumn - chunkStartCol;
      } else {
        break;
      }
    }
  }

  for (let i = visibleRowStart; i < visibleRowEnd; i++) {
    const row = visualRows[i]!;
    const lineIdx = row.lineIdx;
    const c = row.chunkIdx;
    const isVirtualLine = row.isVirtualLine;
    const lineText = isVirtualLine ? "" : (lines[lineIdx] ?? "");
    const isCursorLine = isActive && !isVirtualLine && lineIdx === cursorLine;
    const isContinuation = c > 0;
    const isActiveRow = isCursorLine && c === cursorChunkIdx;
    const hasTrailingNewline = !isVirtualLine && lineIdx < lines.length - 1;
    const showNewlineGlyph =
      inv.newline && row.isLastChunkOfLine && hasTrailingNewline;
    const cursorPos = isActiveRow ? cursorPosInChunk : -1;
    const isCursorAtLineEnd = cursorColumn >= lineText.length;
    const chunkAbsStart = row.absStart;

    const showPlaceholder =
      !isContinuation && !!placeholderLines[lineIdx] && !hasContent;

    if (isVirtualLine) {
      renderedLines.push(
        renderLine(
          <Text>
            {showPlaceholder
              ? renderPlaceholderLine(
                  placeholderLines[lineIdx]!,
                  placeholderLineStartOffsets[lineIdx] ?? 0,
                  `ph-pad-${lineIdx}`,
                )
              : " "}
          </Text>,
          `pad-${lineIdx}`,
          lineIdx,
          totalLines,
          true,
          undefined,
          false,
          0,
          false,
          false,
        ),
      );
      continue;
    }

    const chunk = row.text;
    const bodyNodes: ReactNode[] = renderRowBody({
      chunk,
      chunkAbsStart,
      cursorPos,
      cursorVisible,
      isCursorAtLineEnd,
      inv,
      showAnyInvisible,
      invisibleProps,
      labelByChar,
      labelTextProps,
      tabWidth,
    });

    if (bodyNodes.length === 0 && !showNewlineGlyph && !showPlaceholder) {
      bodyNodes.push(<Text key="b"> </Text>);
    }

    renderedLines.push(
      renderLine(
        // In per-line mode a decoration's width can change a frame before the
        // re-measure lands; without this the too-wide chunk would be soft-
        // wrapped by Ink into extra rows. Truncate keeps each chunk on its own
        // row (it fits exactly once measured), so at worst it clips for one
        // frame instead of exploding.
        <Text {...textProps} wrap={measurePerLine ? "truncate" : "wrap"}>
          {bodyNodes}
          {showNewlineGlyph ? (
            <Text key="nl" {...invisibleProps}>
              ↵
            </Text>
          ) : null}
          {showPlaceholder
            ? renderPlaceholderLine(
                placeholderLines[lineIdx]!,
                placeholderLineStartOffsets[lineIdx] ?? 0,
                `ph-${lineIdx}`,
              )
            : null}
        </Text>,
        `${lineIdx}-${c}`,
        lineIdx,
        totalLines,
        false,
        i === visibleRowStart ? contentRef : undefined,
        isContinuation,
        c,
        isActiveRow,
        row.isLastChunkOfLine,
      ),
    );
  }

  return <Box flexDirection="column" width="100%">{renderedLines}</Box>;
};
