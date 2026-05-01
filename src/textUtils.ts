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
  const lineStart = findLineStart(value, cursor);
  let pos = cursor - 1;
  while (pos > lineStart && /\s/.test(value[pos]!) && value[pos] !== "\n") {
    pos -= 1;
  }
  while (pos > lineStart && !/\s/.test(value[pos - 1]!)) {
    pos -= 1;
  }
  return Math.max(lineStart, pos);
};

export const findNextWordBoundary = (value: string, cursor: number): number => {
  const lineEnd = findLineEnd(value, cursor);
  let pos = cursor;
  while (pos < lineEnd && !/\s/.test(value[pos]!)) {
    pos += 1;
  }
  while (pos < lineEnd && /\s/.test(value[pos]!) && value[pos] !== "\n") {
    pos += 1;
  }
  return Math.min(lineEnd, pos);
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
