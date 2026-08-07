import { describe, it, expect } from "vitest";
import {
  isDynamicStyle,
  buildDynamicRuns,
  computeSegments,
  computeLabels,
  MIN_NEXT_AFTER_MS,
  type Segment,
} from "../../src/textUtils.js";
import type { TDynamicStyle } from "../../src/types.js";

describe("isDynamicStyle", () => {
  it("is true only for entries carrying a fn", () => {
    expect(isDynamicStyle({ fn: () => ({}) })).toBe(true);
    expect(isDynamicStyle({ color: "red" })).toBe(false);
    expect(isDynamicStyle(undefined)).toBe(false);
    // A stray non-function `fn` is not a dynamic style.
    expect(isDynamicStyle({ fn: 3 } as never)).toBe(false);
  });
});

// Build segments the same way TextArea does, then filter to dynamic labels.
const segmentsFor = (value: string, label: string): Segment[] =>
  computeSegments(computeLabels(value, [{ pattern: /\S+/g, label }])).filter(
    (s) => s.label === label,
  );

describe("buildDynamicRuns", () => {
  it("passes grapheme index/length and maps props per char", () => {
    const seen: { index: number; length: number }[] = [];
    const dyn: Record<string, TDynamicStyle> = {
      ultra: {
        fn: ({ index, length }) => {
          seen.push({ index, length });
          return { color: `#00000${index}` };
        },
      },
    };
    // "  abc" -> run "abc" starts at abs offset 2.
    const value = "  abc";
    const segs = segmentsFor(value, "ultra");
    const { charProps } = buildDynamicRuns(value, segs, dyn, {});

    expect(seen).toEqual([
      { index: 0, length: 3 },
      { index: 1, length: 3 },
      { index: 2, length: 3 },
    ]);
    // Keyed by absolute code-unit offset.
    expect(charProps.get(2)?.color).toBe("#000000");
    expect(charProps.get(3)?.color).toBe("#000001");
    expect(charProps.get(4)?.color).toBe("#000002");
    expect(charProps.has(0)).toBe(false);
  });

  it("skips graphemes whose fn returns falsey (fall-through)", () => {
    const dyn: Record<string, TDynamicStyle> = {
      ultra: { fn: ({ index }) => (index === 1 ? undefined : { bold: true }) },
    };
    const value = "abc";
    const segs = segmentsFor(value, "ultra");
    const { charProps } = buildDynamicRuns(value, segs, dyn, {});
    expect(charProps.has(0)).toBe(true);
    expect(charProps.has(1)).toBe(false); // falsey -> not in map
    expect(charProps.has(2)).toBe(true);
  });

  it("aggregates min positive nextAfter (floored) and last nextMeta", () => {
    const dyn: Record<string, TDynamicStyle> = {
      ultra: {
        fn: ({ index }) => ({
          color: "red",
          nextAfter: index === 0 ? 200 : 90, // min = 90
          nextMeta: { seenIndex: index }, // last wins -> index 2
        }),
      },
    };
    const value = "abc";
    const segs = segmentsFor(value, "ultra");
    const { timings } = buildDynamicRuns(value, segs, dyn, {});
    expect(timings).toHaveLength(1);
    expect(timings[0]!.nextAfter).toBe(90);
    expect(timings[0]!.nextMeta).toEqual({ seenIndex: 2 });
  });

  it("floors nextAfter at MIN_NEXT_AFTER_MS", () => {
    const dyn: Record<string, TDynamicStyle> = {
      ultra: { fn: () => ({ nextAfter: 0.5 }) },
    };
    const value = "ab";
    const segs = segmentsFor(value, "ultra");
    const { timings } = buildDynamicRuns(value, segs, dyn, {});
    expect(timings[0]!.nextAfter).toBe(MIN_NEXT_AFTER_MS);
  });

  it("omits timing when no grapheme requests a re-render", () => {
    const dyn: Record<string, TDynamicStyle> = {
      ultra: { fn: () => ({ color: "red" }) }, // no nextAfter
    };
    const value = "ab";
    const segs = segmentsFor(value, "ultra");
    const { timings, liveRunKeys } = buildDynamicRuns(value, segs, dyn, {});
    expect(timings).toHaveLength(0);
    expect(liveRunKeys.size).toBe(1);
  });

  it("seeds meta from initialMeta, then reads per-occurrence overrides", () => {
    const metas: unknown[] = [];
    const dyn: Record<string, TDynamicStyle> = {
      ultra: {
        fn: ({ meta }) => {
          metas.push(meta);
          return { color: "red" };
        },
        initialMeta: { phase: 7 },
      },
    };
    // Two separate runs -> two occurrences, keyed independently by start.
    const value = "aa bb";
    const segs = segmentsFor(value, "ultra");
    expect(segs).toHaveLength(2);

    // First run has a stored meta; second falls back to initialMeta.
    buildDynamicRuns(value, segs, dyn, { "ultra@0": { phase: 42 } });
    // 2 graphemes for run@0 (phase 42) then 2 for run@3 (phase 7).
    expect(metas).toEqual([
      { phase: 42 },
      { phase: 42 },
      { phase: 7 },
      { phase: 7 },
    ]);
  });
});
