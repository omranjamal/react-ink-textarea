import { describe, it, expect } from "vitest";
import {
  chunkString,
  chunkLineForCursor,
  renderChunkWithCursor,
} from "../../src/textUtils.js";

describe("chunkString", () => {
  it("returns array with empty string for empty input", () => {
    expect(chunkString("", 10)).toEqual([""]);
  });

  it("returns original string when width is 0", () => {
    expect(chunkString("hello", 0)).toEqual(["hello"]);
  });

  it("returns single chunk when text is shorter than width", () => {
    expect(chunkString("hello", 10)).toEqual(["hello"]);
  });

  it("returns single chunk when text equals width", () => {
    expect(chunkString("hello", 5)).toEqual(["hello"]);
  });

  it("splits into two chunks when text exceeds width", () => {
    expect(chunkString("abcdef", 5)).toEqual(["abcde", "f"]);
  });

  it("splits evenly into equal chunks", () => {
    expect(chunkString("abcdefghij", 5)).toEqual(["abcde", "fghij"]);
  });

  it("last chunk is shorter when not evenly divisible", () => {
    expect(chunkString("abcdefgh", 5)).toEqual(["abcde", "fgh"]);
  });

  it("splits into three chunks", () => {
    expect(chunkString("abcdefghijklmno", 5)).toEqual([
      "abcde",
      "fghij",
      "klmno",
    ]);
  });

  it("splits at width=1 into individual characters", () => {
    expect(chunkString("abc", 1)).toEqual(["a", "b", "c"]);
  });
});

describe("chunkLineForCursor", () => {
  it("returns whole line when lineWidth=0", () => {
    expect(chunkLineForCursor("hello", 2, 0)).toEqual(["hello"]);
  });

  it("splits line into chunks of lineWidth", () => {
    expect(chunkLineForCursor("abcdefghij", 0, 5)).toEqual(["abcde", "fghij"]);
  });

  it("adds extra empty chunk when cursor at exact width boundary past end", () => {
    expect(chunkLineForCursor("abcde", 5, 5)).toEqual(["abcde", ""]);
  });

  it("returns single empty chunk for empty line", () => {
    expect(chunkLineForCursor("", 0, 5)).toEqual([""]);
  });
});

describe("renderChunkWithCursor", () => {
  const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

  it("places cursor on a character", () => {
    const result = renderChunkWithCursor("hello", 2, true, false);
    expect(result).toContain("\x1b[7ml\x1b[27m");
    expect(strip(result)).toBe("hello");
  });

  it("renders highlighted space at cursor past end when visible", () => {
    const result = renderChunkWithCursor("hi", 2, true, true);
    expect(result).toContain("\x1b[7m \x1b[27m");
    expect(strip(result)).toBe("hi ");
  });

  it("renders plain space at cursor past end when invisible", () => {
    expect(renderChunkWithCursor("hi", 2, false, true)).toBe("hi ");
  });

  it("renders plain character when cursor on char and invisible", () => {
    expect(renderChunkWithCursor("hello", 1, false, false)).toBe("hello");
  });

  it("renders highlighted cursor in empty chunk", () => {
    const result = renderChunkWithCursor("", 0, true, true);
    expect(result).toContain("\x1b[7m \x1b[27m");
  });
});
