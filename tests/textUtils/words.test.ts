import { describe, it, expect } from "vitest";
import {
  findPrevWordBoundary,
  findNextWordBoundary,
} from "../../src/textUtils.js";

describe("findPrevWordBoundary", () => {
  it("returns 0 when at start of string", () => {
    expect(findPrevWordBoundary("hello", 0)).toBe(0);
  });

  it("jumps to start of current word", () => {
    expect(findPrevWordBoundary("hello world", 10)).toBe(6);
  });

  it("skips whitespace then jumps to start of previous word", () => {
    expect(findPrevWordBoundary("hello world", 11)).toBe(6);
  });

  it("jumps to start of word on current line", () => {
    expect(findPrevWordBoundary("hello\nworld", 8)).toBe(6);
  });

  it("crosses newline to start of word on previous line", () => {
    expect(findPrevWordBoundary("hello\nworld", 6)).toBe(0);
  });

  it("crosses multiple blank lines to previous word", () => {
    expect(findPrevWordBoundary("hello\n\n\nworld", 8)).toBe(0);
  });

  it("handles single character word", () => {
    expect(findPrevWordBoundary("a b", 3)).toBe(2);
  });
});

describe("findNextWordBoundary", () => {
  it("returns end of string when at start of last word", () => {
    expect(findNextWordBoundary("hello", 0)).toBe(5);
  });

  it("jumps past current word and trailing whitespace to next word start", () => {
    expect(findNextWordBoundary("hello world", 0)).toBe(6);
  });

  it("from whitespace: skips whitespace to next word start", () => {
    expect(findNextWordBoundary("hello world", 5)).toBe(6);
  });

  it("crosses newline to next word", () => {
    expect(findNextWordBoundary("hello\nworld", 0)).toBe(6);
  });

  it("from newline: skips newline to next word", () => {
    expect(findNextWordBoundary("hello\nworld", 5)).toBe(6);
  });

  it("crosses multiple blank lines to next word", () => {
    expect(findNextWordBoundary("hello\n\n\nworld", 5)).toBe(8);
  });
});
