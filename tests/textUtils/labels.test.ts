import { describe, it, expect } from "vitest";
import {
  computeLabels,
  computeSegments,
  getLabelAt,
  findSegmentIndex,
} from "../../src/textUtils.js";

describe("computeLabels", () => {
  it("labels chars matching a regex with the key name", () => {
    const out = computeLabels("hi there", { word: /[a-zA-Z]{2,}/g });
    expect(out).toEqual([
      "word",
      "word",
      "text",
      "word",
      "word",
      "word",
      "word",
      "word",
    ]);
  });

  it("first key wins when ranges overlap", () => {
    const out = computeLabels("abcdef", { a: /[a-z]+/g, b: /[a-c]+/g });
    expect(out.every((l) => l === "a")).toBe(true);
  });

  it("does not infinite-loop on zero-length matches", () => {
    const out = computeLabels("abc", { z: /(?:)/g });
    expect(out).toEqual(["text", "text", "text"]);
  });

  it("returns empty array for empty value", () => {
    expect(computeLabels("", { w: /\w+/g })).toEqual([]);
  });
});

describe("computeSegments", () => {
  it("returns alternating runs by label", () => {
    const labelByChar = computeLabels("hi there", { word: /[a-zA-Z]{2,}/g });
    expect(computeSegments(labelByChar)).toEqual([
      { start: 0, end: 2, label: "word" },
      { start: 2, end: 3, label: "text" },
      { start: 3, end: 8, label: "word" },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(computeSegments([])).toEqual([]);
  });
});

describe("getLabelAt", () => {
  it("returns label of char at cursor", () => {
    const labelByChar = ["word", "word", "text", "word"];
    expect(getLabelAt(labelByChar, 0)).toBe("word");
    expect(getLabelAt(labelByChar, 2)).toBe("text");
  });

  it("returns text past end of value", () => {
    expect(getLabelAt(["word", "word"], 5)).toBe("text");
  });

  it("returns text for negative cursor", () => {
    expect(getLabelAt(["word"], -1)).toBe("text");
  });
});

describe("findSegmentIndex", () => {
  it("returns index of segment containing the cursor", () => {
    const segs = [
      { start: 0, end: 2, label: "word" },
      { start: 2, end: 3, label: "text" },
      { start: 3, end: 8, label: "word" },
    ];
    expect(findSegmentIndex(segs, 0)).toBe(0);
    expect(findSegmentIndex(segs, 2)).toBe(1);
    expect(findSegmentIndex(segs, 5)).toBe(2);
  });

  it("returns segments.length when cursor past end", () => {
    const segs = [{ start: 0, end: 2, label: "word" }];
    expect(findSegmentIndex(segs, 5)).toBe(1);
  });

  it("returns 0 for empty segments", () => {
    expect(findSegmentIndex([], 0)).toBe(0);
  });
});
