import { describe, it, expect } from "vitest";
import {
  countTrailingEmptyLines,
  findLineStart,
  findLineEnd,
  findPrevWordBoundary,
  findNextWordBoundary,
  getCursorLineAndColumn,
  getCursorFromLineColumn,
} from "../src/textUtils.js";

describe("countTrailingEmptyLines", () => {
  it("returns 0 for empty string", () => {
    expect(countTrailingEmptyLines("")).toBe(0);
  });

  it("returns 0 when no trailing newlines", () => {
    expect(countTrailingEmptyLines("hello")).toBe(0);
  });

  it("returns 1 for single trailing newline", () => {
    expect(countTrailingEmptyLines("hello\n")).toBe(1);
  });

  it("returns N for multiple trailing newlines", () => {
    expect(countTrailingEmptyLines("hello\n\n\n")).toBe(3);
  });

  it("returns full count for string that is only newlines", () => {
    expect(countTrailingEmptyLines("\n\n")).toBe(2);
  });

  it("does not count internal newlines", () => {
    expect(countTrailingEmptyLines("a\nb\nc")).toBe(0);
  });
});

describe("findLineStart", () => {
  it("returns 0 when cursor is at 0", () => {
    expect(findLineStart("hello", 0)).toBe(0);
  });

  it("returns 0 for single-line string", () => {
    expect(findLineStart("hello", 3)).toBe(0);
  });

  it("returns correct start for second line", () => {
    // "hello\nworld" — cursor at 8 (index of 'r') → line start is 6
    expect(findLineStart("hello\nworld", 8)).toBe(6);
  });

  it("returns correct start when cursor is right after newline", () => {
    expect(findLineStart("hello\nworld", 6)).toBe(6);
  });

  it("returns 0 when cursor is on first line", () => {
    expect(findLineStart("hello\nworld", 3)).toBe(0);
  });

  it("handles multiline correctly", () => {
    // "a\nb\nc" — cursor at 4 (the 'c') → line start is 4
    expect(findLineStart("a\nb\nc", 4)).toBe(4);
  });
});

describe("findLineEnd", () => {
  it("returns string length when no newline", () => {
    expect(findLineEnd("hello", 0)).toBe(5);
  });

  it("returns index of next newline", () => {
    expect(findLineEnd("hello\nworld", 0)).toBe(5);
  });

  it("returns index of newline when cursor is in the middle", () => {
    expect(findLineEnd("hello\nworld", 2)).toBe(5);
  });

  it("returns string length when cursor is on last line", () => {
    expect(findLineEnd("hello\nworld", 6)).toBe(11);
  });

  it("handles cursor at newline position", () => {
    expect(findLineEnd("a\nb", 1)).toBe(1);
  });

  it("handles empty lines", () => {
    // "a\n\nb" — cursor at 0 (line 'a') → end is 1
    expect(findLineEnd("a\n\nb", 0)).toBe(1);
  });
});

describe("findPrevWordBoundary", () => {
  it("returns 0 when at start of string", () => {
    expect(findPrevWordBoundary("hello", 0)).toBe(0);
  });

  it("jumps to start of current word", () => {
    expect(findPrevWordBoundary("hello world", 10)).toBe(6);
  });

  it("skips whitespace then jumps to start of previous word", () => {
    // cursor after 'world' trailing space → lands at 'w'
    expect(findPrevWordBoundary("hello world", 11)).toBe(6);
  });

  it("stays at line start, does not cross newline", () => {
    // "hello\nworld" — cursor at 8 (mid 'world') → should not go past line start (6)
    expect(findPrevWordBoundary("hello\nworld", 8)).toBe(6);
  });

  it("returns line start when at beginning of line", () => {
    expect(findPrevWordBoundary("hello\nworld", 6)).toBe(6);
  });

  it("handles single character word", () => {
    expect(findPrevWordBoundary("a b", 3)).toBe(2);
  });
});

describe("findNextWordBoundary", () => {
  it("returns line end when at end of word on last line", () => {
    expect(findNextWordBoundary("hello", 0)).toBe(5);
  });

  it("jumps past current word and trailing whitespace to next word start", () => {
    // from pos 0: skip 'hello' (0-4), skip space (5), land at 'w' (6)
    expect(findNextWordBoundary("hello world", 0)).toBe(6);
  });

  it("from whitespace: skips whitespace to next word start", () => {
    // from pos 5 (the space): skip space, land at 'w' (6)
    expect(findNextWordBoundary("hello world", 5)).toBe(6);
  });

  it("does not cross newline", () => {
    expect(findNextWordBoundary("hello\nworld", 0)).toBe(5);
  });

  it("returns line end when already at line end", () => {
    expect(findNextWordBoundary("hello\nworld", 5)).toBe(5);
  });
});

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
    // "a\nb\nc" — cursor at 4 ('c') → line 2, col 0
    expect(getCursorLineAndColumn("a\nb\nc", 4)).toEqual({
      line: 2,
      column: 0,
    });
  });

  it("cursor at end of string", () => {
    expect(getCursorLineAndColumn("hello", 5)).toEqual({ line: 0, column: 5 });
  });

  it("cursor at newline character position", () => {
    // cursor at index 5 (the '\n') → still line 0, col 5
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
    // "hello\nworld" line 1, col 3 → cursor = 6 + 3 = 9
    expect(getCursorFromLineColumn("hello\nworld", 1, 3)).toEqual({
      cursor: 9,
      clampedLine: 1,
      clampedCol: 3,
    });
  });

  it("clamps line to last line when exceeding total lines", () => {
    const result = getCursorFromLineColumn("hello\nworld", 5, 0);
    expect(result.clampedLine).toBe(1);
    expect(result.clampedCol).toBe(5); // end of last line
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
