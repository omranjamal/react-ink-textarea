import { describe, it, expect } from "vitest";
import {
  countTrailingEmptyLines,
  findLineStart,
  findLineEnd,
} from "../../src/textUtils.js";

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
    expect(findLineStart("hello\nworld", 8)).toBe(6);
  });

  it("returns correct start when cursor is right after newline", () => {
    expect(findLineStart("hello\nworld", 6)).toBe(6);
  });

  it("returns 0 when cursor is on first line", () => {
    expect(findLineStart("hello\nworld", 3)).toBe(0);
  });

  it("handles multiline correctly", () => {
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
    expect(findLineEnd("a\n\nb", 0)).toBe(1);
  });
});
