export const countTrailingEmptyLines = (text: string): number => {
  let count = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === "\n") {
      count++;
    } else {
      break;
    }
  }
  return count;
};

export const findLineStart = (value: string, cursor: number): number => {
  if (cursor <= 0) return 0;
  const idx = value.lastIndexOf("\n", cursor - 1);
  return idx === -1 ? 0 : idx + 1;
};

export const findLineEnd = (value: string, cursor: number): number => {
  const idx = value.indexOf("\n", cursor);
  return idx === -1 ? value.length : idx;
};

export const findPrevWordBoundary = (value: string, cursor: number): number => {
  let pos = cursor - 1;
  while (pos >= 0 && /\s/.test(value[pos]!)) {
    pos -= 1;
  }
  while (pos >= 0 && !/\s/.test(value[pos]!)) {
    pos -= 1;
  }
  return pos + 1;
};

export const findNextWordBoundary = (value: string, cursor: number): number => {
  let pos = cursor;
  while (pos < value.length && !/\s/.test(value[pos]!)) {
    pos += 1;
  }
  while (pos < value.length && /\s/.test(value[pos]!)) {
    pos += 1;
  }
  return pos;
};

export const getCursorLineAndColumn = (
  value: string,
  cursor: number,
): { line: number; column: number } => {
  let line = 0;
  let lastLineStart = 0;
  for (let i = 0; i < cursor; i++) {
    if (value[i] === "\n") {
      line += 1;
      lastLineStart = i + 1;
    }
  }
  return { line, column: cursor - lastLineStart };
};

export const chunkString = (text: string, width: number): string[] => {
  if (width <= 0 || text.length === 0) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += width) {
    chunks.push(text.slice(i, i + width));
  }
  return chunks;
};

export const buildChunkedCursorLine = (
  lineText: string,
  cursorColumn: number,
  lineWidth: number,
  cursorVisible: boolean,
): string => {
  const atCursorChar = lineText[cursorColumn] ?? " ";
  const cursorStr = cursorVisible
    ? `\x1b[7m${atCursorChar}\x1b[27m`
    : atCursorChar === " " && cursorColumn >= lineText.length
      ? " "
      : atCursorChar;

  if (lineWidth <= 0) {
    return lineText.slice(0, cursorColumn) + cursorStr + lineText.slice(cursorColumn + 1);
  }

  const totalLen = Math.max(lineText.length, cursorColumn + 1);
  const numChunks = Math.ceil(totalLen / lineWidth);
  const chunkIdx = Math.floor(cursorColumn / lineWidth);
  const posInChunk = cursorColumn % lineWidth;

  const parts: string[] = [];
  for (let i = 0; i < numChunks; i++) {
    const chunk = lineText.slice(i * lineWidth, (i + 1) * lineWidth);
    if (i === chunkIdx) {
      const before = chunk.slice(0, posInChunk);
      const atCursor = chunk[posInChunk] ?? " ";
      const cs = cursorVisible
        ? `\x1b[7m${atCursor}\x1b[27m`
        : atCursor === " " && cursorColumn >= lineText.length
          ? " "
          : atCursor;
      parts.push(before + cs + chunk.slice(posInChunk + 1));
    } else {
      parts.push(chunk || " ");
    }
  }
  return parts.join("\n");
};

export const computeVisualUpCursor = (
  value: string,
  cursor: number,
  lineWidth: number,
): number => {
  const { line: currentLine, column: col } = getCursorLineAndColumn(value, cursor);
  const vRow = Math.floor(col / lineWidth);
  const vCol = col % lineWidth;

  if (vRow > 0) {
    const lineStart = findLineStart(value, cursor);
    const lineEnd = findLineEnd(value, cursor);
    return Math.min(lineStart + (vRow - 1) * lineWidth + vCol, lineEnd);
  }

  if (currentLine === 0) return findLineStart(value, cursor);

  const prevLineEnd = findLineStart(value, cursor) - 1;
  const prevLineStart = findLineStart(value, prevLineEnd);
  const prevLineLength = prevLineEnd - prevLineStart;
  const prevLastVRow = Math.floor(prevLineLength / lineWidth);
  return Math.min(
    prevLineStart + prevLastVRow * lineWidth + vCol,
    prevLineStart + prevLineLength,
  );
};

export const computeVisualDownCursor = (
  value: string,
  cursor: number,
  lineWidth: number,
): number | null => {
  const { column } = getCursorLineAndColumn(value, cursor);
  const currentLineStart = findLineStart(value, cursor);
  const currentLineEnd = findLineEnd(value, cursor);
  const currentLineLength = currentLineEnd - currentLineStart;
  const vRow = Math.floor(column / lineWidth);
  const vCol = column % lineWidth;
  const lastVRow = Math.floor(currentLineLength / lineWidth);

  if (vRow < lastVRow) {
    return Math.min(
      currentLineStart + (vRow + 1) * lineWidth + vCol,
      currentLineEnd,
    );
  }

  if (currentLineEnd >= value.length) return null;

  const nextLineStart = currentLineEnd + 1;
  const nextLineEnd = findLineEnd(value, nextLineStart);
  return Math.min(nextLineStart + vCol, nextLineEnd);
};

export const getCursorFromLineColumn = (
  value: string,
  line: number,
  column: number,
): { cursor: number; clampedLine: number; clampedCol: number } => {
  const lines = value.split("\n");
  const numLines = lines.length;

  const clampedLine = Math.max(0, Math.min(line, numLines - 1));

  const targetLine = lines[clampedLine] ?? "";
  let clampedCol: number;
  if (line > numLines - 1) {
    clampedCol = targetLine.length;
  } else {
    clampedCol = Math.max(0, Math.min(column, targetLine.length));
  }

  let cursor = 0;
  for (let i = 0; i < clampedLine; i++) {
    cursor += lines[i]!.length + 1;
  }
  cursor += clampedCol;

  return { cursor, clampedLine, clampedCol };
};
