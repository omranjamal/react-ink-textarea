import { describe, it, expect } from "vitest";
import {
  getCursorLineAndColumn,
  getCursorFromLineColumn,
  computeVisualUpCursor,
  computeVisualDownCursor,
} from "../../src/textUtils.js";

describe("getCursorLineAndColumn", () => {
  it("returns 0,0 for empty string cursor at 0", () => {
    expect(getCursorLineAndColumn("", 0)).toEqual({ line: 0, column: 0 });
  });

  it("returns correct column on first line", () => {
    expect(getCursorLineAndColumn("hello", 3)).toEqual({ line: 0, column: 3 });
  });

  it("returns line 1 after first newline", () => {
    expect(getCursorLineAndColumn("hello\nworld", 6)).toEqual({
      line: 1,
      column: 0,
    });
  });

  it("returns correct line and column in multiline", () => {
    expect(getCursorLineAndColumn("a\nb\nc", 4)).toEqual({
      line: 2,
      column: 0,
    });
  });

  it("cursor at end of string", () => {
    expect(getCursorLineAndColumn("hello", 5)).toEqual({ line: 0, column: 5 });
  });

  it("cursor at newline character position", () => {
    expect(getCursorLineAndColumn("hello\nworld", 5)).toEqual({
      line: 0,
      column: 5,
    });
  });
});

describe("getCursorFromLineColumn", () => {
  it("returns 0 for line 0, col 0", () => {
    expect(getCursorFromLineColumn("hello\nworld", 0, 0)).toEqual({
      cursor: 0,
      clampedLine: 0,
      clampedCol: 0,
    });
  });

  it("returns correct cursor for valid line and col", () => {
    expect(getCursorFromLineColumn("hello\nworld", 1, 3)).toEqual({
      cursor: 9,
      clampedLine: 1,
      clampedCol: 3,
    });
  });

  it("clamps line to last line when exceeding total lines", () => {
    const result = getCursorFromLineColumn("hello\nworld", 5, 0);
    expect(result.clampedLine).toBe(1);
    expect(result.clampedCol).toBe(5);
  });

  it("clamps column to line length", () => {
    const result = getCursorFromLineColumn("hello\nworld", 0, 100);
    expect(result.clampedLine).toBe(0);
    expect(result.clampedCol).toBe(5);
  });

  it("clamps negative line to 0", () => {
    const result = getCursorFromLineColumn("hello", -1, 0);
    expect(result.clampedLine).toBe(0);
  });

  it("clamps negative column to 0", () => {
    const result = getCursorFromLineColumn("hello", 0, -5);
    expect(result.clampedCol).toBe(0);
  });

  it("handles Infinity line — clamps to last line end", () => {
    const result = getCursorFromLineColumn("hello\nworld", Infinity, 0);
    expect(result.clampedLine).toBe(1);
    expect(result.clampedCol).toBe(5);
  });

  it("handles Infinity column — clamps to line length", () => {
    const result = getCursorFromLineColumn("hello\nworld", 0, Infinity);
    expect(result.clampedLine).toBe(0);
    expect(result.clampedCol).toBe(5);
  });
});

describe("computeVisualUpCursor", () => {
  it("on visual row 0 of logical line 0: returns line start", () => {
    expect(computeVisualUpCursor("abcde", 2, 5)).toBe(0);
  });

  it("moves up within same logical line (row 1 → row 0)", () => {
    expect(computeVisualUpCursor("abcdefghij", 7, 5)).toBe(2);
  });

  it("preserves visual column when moving up within logical line", () => {
    expect(computeVisualUpCursor("abcdefghijklmno", 12, 5)).toBe(7);
  });

  it("moves from visual row 0 of logical line 1 to last visual row of line 0", () => {
    expect(computeVisualUpCursor("abcdefghij\nklmno", 11, 5)).toBe(10);
  });

  it("preserves visual column when crossing logical line boundary", () => {
    expect(computeVisualUpCursor("abcdefghij\nklmno", 13, 5)).toBe(10);
  });

  it("clamps to prev line end when visual column exceeds prev line length", () => {
    expect(computeVisualUpCursor("ab\ncdefghij", 7, 5)).toBe(2);
  });

  it("with lineWidth larger than line: moves to previous logical line directly", () => {
    expect(computeVisualUpCursor("hello\nworld", 6, 10)).toBe(0);
  });
});

describe("computeVisualDownCursor", () => {
  it("moves down within same logical line (row 0 → row 1)", () => {
    expect(computeVisualDownCursor("abcdefghij", 2, 5)).toBe(7);
  });

  it("preserves visual column when moving down within logical line", () => {
    expect(computeVisualDownCursor("abcdefghijklmno", 7, 5)).toBe(12);
  });

  it("clamps to line end when next visual row exceeds content", () => {
    expect(computeVisualDownCursor("abcde", 2, 5)).toBe(5);
  });

  it("moves to next logical line from last visual row", () => {
    expect(computeVisualDownCursor("abcde\nfghij", 5, 5)).toBe(6);
  });

  it("preserves visual column when moving to next logical line", () => {
    expect(computeVisualDownCursor("abcdefghij\nklmno", 10, 5)).toBe(11);
  });

  it("clamps visual column to next line end when shorter", () => {
    expect(computeVisualDownCursor("abcdefgh\nkl", 8, 5)).toBe(11);
  });

  it("returns null on last logical line when past all visual rows", () => {
    expect(computeVisualDownCursor("abcde", 5, 5)).toBeNull();
  });

  it("returns null on single-line text when past all visual rows", () => {
    expect(computeVisualDownCursor("hello", 5, 10)).toBeNull();
  });

  it("returns null on last logical line of multiline text", () => {
    expect(computeVisualDownCursor("line1\nline2", 11, 10)).toBeNull();
  });
});
