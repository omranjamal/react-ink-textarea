import { Box, Text, useBoxMetrics } from "ink";
import type { DOMElement } from "ink";
import { useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_CURSOR_INTERVAL,
  DEFAULT_TYPING_PAUSE,
  DEFAULT_MAX_UNDO,
  DEFAULT_UNDO_GROUP_DELAY,
  DEFAULT_AUTO_NEW_LINE_LIMIT,
  DEFAULT_INITIAL_LINE_COUNT,
} from "./constants.js";
import {
  getCursorLineAndColumn,
  chunkString,
  buildChunkedCursorLine,
} from "./textUtils.js";
import { useCursorState } from "./hooks/useCursorState.js";
import { useUndo } from "./hooks/useUndo.js";
import { useCursorBlink } from "./hooks/useCursorBlink.js";
import { useKeyboardInput } from "./hooks/useKeyboardInput.js";
import type { TextAreaProps, TLinePrefixProps } from "./types.js";

export const TextArea = ({
  isActive,
  onSubmit,
  placeholder,
  linePrefix,
  cursorInterval = DEFAULT_CURSOR_INTERVAL,
  typingPause = DEFAULT_TYPING_PAUSE,
  maxUndo = DEFAULT_MAX_UNDO,
  undoGroupDelay = DEFAULT_UNDO_GROUP_DELAY,
  autoNewLineLimit = DEFAULT_AUTO_NEW_LINE_LIMIT,
  highlightActiveLine = false,
  activeLineColor = undefined,
  enableArrowNavigation = true,
  value: controlledValue,
  cursorPosition: controlledPosition,
  onChange,
  onCursorChange,
  onFirstLineUp,
  onLastLineDown,
  initialLineCount = DEFAULT_INITIAL_LINE_COUNT,
  onDimensions,
}: TextAreaProps): ReactNode => {
  const { value, cursor, setValue, setCursor } = useCursorState({
    controlledValue,
    controlledPosition,
    onChange,
    onCursorChange,
  });

  const lines = value.split("\n");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length]);

  const { pushUndo, popUndo, resetMutationTracking } = useUndo({
    maxUndo,
    undoGroupDelay,
  });

  const { cursorVisible, resetBlink } = useCursorBlink({
    isActive,
    cursorInterval,
    typingPause,
  });

  useKeyboardInput({
    isActive,
    value,
    cursor,
    enableArrowNavigation,
    autoNewLineLimit,
    onSubmit,
    onFirstLineUp,
    onLastLineDown,
    setValue,
    setCursor,
    pushUndo,
    popUndo,
    resetMutationTracking,
    resetBlink,
    lineWidth,
  });

  const totalLines = Math.max(lines.length, initialLineCount);
  const hasContent = value.replace(/\n/g, "").length > 0;
  const { line: cursorLine, column: cursorColumn } = getCursorLineAndColumn(
    value,
    cursor,
  );

  const renderLine = (
    content: ReactNode,
    key: string | number,
    lineNumber: number,
    totalLinesArg: number,
    isVirtualLine: boolean,
    ref?: { current: DOMElement | null },
  ): ReactNode => {
    const isActiveLine = isActive && lineNumber === cursorLine;
    const prefixProps: TLinePrefixProps = {
      lineNumber,
      totalLines: totalLinesArg,
      isActiveLine,
      isVirtualLine,
    };
    const prefix =
      typeof linePrefix === "function" ? linePrefix(prefixProps) : linePrefix;

    const isHighlighted = highlightActiveLine && isActiveLine;

    return prefix ? (
      <Box
        key={key}
        width="100%"
        flexDirection="row"
        backgroundColor={isHighlighted ? activeLineColor : undefined}
      >
        <Box flexShrink={0}>{prefix}</Box>
        <Box ref={ref} flexGrow={1}>
          {content}
        </Box>
      </Box>
    ) : (
      <Box
        key={key}
        width="100%"
        backgroundColor={isHighlighted ? activeLineColor : undefined}
      >
        <Box ref={ref} flexGrow={1}>
          {content}
        </Box>
      </Box>
    );
  };

  const placeholderLines = placeholder ? placeholder.split("\n") : [];

  if (value.length === 0 && !isActive && placeholderLines.length > 0) {
    return (
      <Box flexDirection="column">
        {Array.from({ length: initialLineCount }, (_, i) =>
          renderLine(
            <Text dimColor>{placeholderLines[i] ?? " "}</Text>,
            i,
            i,
            initialLineCount,
            i > 0,
            i === 0 ? contentRef : undefined,
          ),
        )}
      </Box>
    );
  }

  if (value.length === 0 && isActive) {
    return (
      <Box flexDirection="column">
        {Array.from({ length: initialLineCount }, (_, i) =>
          renderLine(
            <Text>
              {i === cursorLine && cursorVisible ? "\x1b[7m \x1b[27m" : " "}
              {placeholderLines[i] ? (
                <Text dimColor>{placeholderLines[i]}</Text>
              ) : null}
            </Text>,
            i,
            i,
            initialLineCount,
            i > 0,
            i === 0 ? contentRef : undefined,
          ),
        )}
      </Box>
    );
  }

  const linesToRender = !hasContent
    ? Math.max(lines.length, initialLineCount)
    : lines.length;

  const renderedLines = Array.from({ length: linesToRender }, (_, lineIdx) => {
    const lineText = lines[lineIdx] ?? "";
    const isCursorLine = lineIdx === cursorLine;
    const isVirtualLine = lineIdx >= lines.length;

    if (!isCursorLine || !isActive) {
      const displayText = lineWidth > 0
        ? chunkString(lineText, lineWidth).join("\n") || " "
        : lineText || " ";
      return renderLine(
        <Text>
          {displayText}
          {placeholderLines[lineIdx] && !hasContent ? (
            <Text dimColor>{placeholderLines[lineIdx]}</Text>
          ) : null}
        </Text>,
        lineIdx,
        lineIdx,
        totalLines,
        isVirtualLine,
        lineIdx === 0 ? contentRef : undefined,
      );
    }

    return renderLine(
      <Text>
        {buildChunkedCursorLine(lineText, cursorColumn, lineWidth, cursorVisible)}
        {placeholderLines[lineIdx] && !hasContent ? (
          <Text dimColor>{placeholderLines[lineIdx]}</Text>
        ) : null}
      </Text>,
      lineIdx,
      lineIdx,
      totalLines,
      isVirtualLine,
      lineIdx === 0 ? contentRef : undefined,
    );
  });

  while (renderedLines.length < initialLineCount) {
    const padIdx = renderedLines.length;
    renderedLines.push(
      renderLine(
        <Text>
          {placeholderLines[padIdx] && !hasContent ? (
            <Text dimColor>{placeholderLines[padIdx]}</Text>
          ) : (
            " "
          )}
        </Text>,
        padIdx,
        padIdx,
        totalLines,
        true,
      ),
    );
  }

  return <Box flexDirection="column">{renderedLines}</Box>;
};
