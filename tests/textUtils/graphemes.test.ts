import { describe, it, expect } from "vitest";
import {
  prevGraphemeOffset,
  nextGraphemeOffset,
} from "../../src/textUtils.js";

describe("textUtils > graphemes", () => {
  describe("prevGraphemeOffset", () => {
    it("clamps at start", () => {
      expect(prevGraphemeOffset("abc", 0)).toBe(0);
      expect(prevGraphemeOffset("abc", -5)).toBe(0);
    });

    it("ASCII fast path: each step is 1 code unit", () => {
      expect(prevGraphemeOffset("abc", 3)).toBe(2);
      expect(prevGraphemeOffset("abc", 2)).toBe(1);
      expect(prevGraphemeOffset("abc", 1)).toBe(0);
    });

    it("steps over combining mark (NFD é = e + ◌́)", () => {
      const s = "ábc"; // a-with-combining-acute is 2 code units
      // s.length = 4: [a, ́, b, c]
      // Cursor at index 2 (after combining mark) → grapheme start at 0
      expect(prevGraphemeOffset(s, 2)).toBe(0);
    });

    it("steps over surrogate pair (single emoji)", () => {
      const s = "🚀"; // length 2 (high+low surrogate)
      expect(prevGraphemeOffset(s, 2)).toBe(0);
    });

    it("steps over ZWJ family emoji", () => {
      const s = "👨‍👩‍👧"; // length 8
      expect(prevGraphemeOffset(s, s.length)).toBe(0);
    });

    it("steps over regional-indicator flag", () => {
      const s = "🇯🇵"; // length 4
      expect(prevGraphemeOffset(s, 4)).toBe(0);
    });

    it("backspace from after 'a' + flag returns to 1, not into the flag", () => {
      const s = "a🇯🇵"; // a (1) + 🇯🇵 (4) = length 5
      expect(prevGraphemeOffset(s, 5)).toBe(1);
    });
  });

  describe("nextGraphemeOffset", () => {
    it("clamps at end", () => {
      expect(nextGraphemeOffset("abc", 3)).toBe(3);
      expect(nextGraphemeOffset("abc", 100)).toBe(3);
    });

    it("ASCII fast path: each step is 1 code unit", () => {
      expect(nextGraphemeOffset("abc", 0)).toBe(1);
      expect(nextGraphemeOffset("abc", 1)).toBe(2);
      expect(nextGraphemeOffset("abc", 2)).toBe(3);
    });

    it("steps over combining mark", () => {
      const s = "ábc";
      expect(nextGraphemeOffset(s, 0)).toBe(2);
    });

    it("steps over surrogate pair (single emoji)", () => {
      const s = "🚀ab";
      expect(nextGraphemeOffset(s, 0)).toBe(2);
    });

    it("steps over ZWJ family emoji", () => {
      const s = "👨‍👩‍👧x";
      expect(nextGraphemeOffset(s, 0)).toBe(8);
    });

    it("steps over regional-indicator flag", () => {
      const s = "🇯🇵x";
      expect(nextGraphemeOffset(s, 0)).toBe(4);
    });
  });
});
