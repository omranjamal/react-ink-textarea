import { describe, it, expect } from "vitest";
import {
  buildVisualRows,
  visualRowForCursor,
} from "../../src/textUtils.js";

describe("buildVisualRows", () => {
  it("emits virtual rows for empty document up to initialLineCount", () => {
    const rows = buildVisualRows([""], 0, 0, 0, 2);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.isVirtualLine).toBe(false);
    expect(rows[0]!.text).toBe("");
    expect(rows[1]!.isVirtualLine).toBe(true);
  });

  it("returns one row per logical line when lineWidth <= 0", () => {
    const rows = buildVisualRows(["abc", "def"], 0, 0, 0, 0);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text).toBe("abc");
    expect(rows[1]!.text).toBe("def");
    expect(rows[0]!.absStart).toBe(0);
    expect(rows[1]!.absStart).toBe(4); // "abc\n" -> 4
    expect(rows[0]!.isLastChunkOfLine).toBe(true);
  });

  it("wraps a line into ceil(len / lineWidth) rows", () => {
    const rows = buildVisualRows(["abcdef"], 3, 0, 0, 0);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text).toBe("abc");
    expect(rows[1]!.text).toBe("def");
    expect(rows[0]!.absStart).toBe(0);
    expect(rows[1]!.absStart).toBe(3);
    expect(rows[0]!.isLastChunkOfLine).toBe(false);
    expect(rows[1]!.isLastChunkOfLine).toBe(true);
  });

  it("absStart maps back to original value via slice", () => {
    const value = "hello\nworld!";
    const lines = value.split("\n");
    const rows = buildVisualRows(lines, 3, 0, 0, 0);
    for (const row of rows) {
      if (row.isVirtualLine) continue;
      expect(value.slice(row.absStart, row.absStart + row.text.length)).toBe(
        row.text,
      );
    }
  });

  it("handles empty line in the middle", () => {
    const rows = buildVisualRows(["a", "", "b"], 3, 0, 0, 0);
    expect(rows).toHaveLength(3);
    expect(rows[1]!.text).toBe("");
    expect(rows[1]!.lineIdx).toBe(1);
    expect(rows[1]!.absStart).toBe(2); // "a\n"
  });

  it("appends extra wrap row when cursor sits at exact width boundary at end of line", () => {
    const lines = ["abcdef"]; // length 6
    const rowsWithCursorAtEnd = buildVisualRows(lines, 3, 0, 6, 0);
    // Without cursor: 2 rows. With cursor at column 6 (== len, % 3 == 0): extra row appended.
    expect(rowsWithCursorAtEnd).toHaveLength(3);
    expect(rowsWithCursorAtEnd[2]!.text).toBe("");
    expect(rowsWithCursorAtEnd[2]!.chunkIdx).toBe(2);
    expect(rowsWithCursorAtEnd[2]!.isLastChunkOfLine).toBe(true);
  });

  it("does not append extra row when cursorColumn == 0 on empty line", () => {
    const rows = buildVisualRows([""], 3, 0, 0, 0);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.text).toBe("");
  });

  it("does not append extra row when cursor at end but not on width boundary", () => {
    const rows = buildVisualRows(["abcde"], 3, 0, 5, 0);
    expect(rows).toHaveLength(2);
    expect(rows[1]!.text).toBe("de");
  });

  it("never appends extra row when lineWidth <= 0", () => {
    const rows = buildVisualRows(["abc"], 0, 0, 3, 0);
    expect(rows).toHaveLength(1);
  });

  it("wraps wide chars by visual width (CJK = 2 cells)", () => {
    // "中文中" = 6 visual cells; lineWidth=4 → "中文" (4) then "中" (2)
    const rows = buildVisualRows(["中文中"], 4, -1, 0, 0);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text).toBe("中文");
    expect(rows[1]!.text).toBe("中");
  });

  it("wraps mixed-width line correctly", () => {
    // "a中b" where a=1, 中=2, b=1; lineWidth=3 → "a中" (3) then "b"
    const rows = buildVisualRows(["a中b"], 3, -1, 0, 0);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text).toBe("a中");
    expect(rows[1]!.text).toBe("b");
  });

  it("does not break a wide char across rows", () => {
    // "a中" with lineWidth=2: 'a' fits (1), 中 (2) overflows → "a" then "中"
    const rows = buildVisualRows(["a中"], 2, -1, 0, 0);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text).toBe("a");
    expect(rows[1]!.text).toBe("中");
  });

  it("wraps emoji as one grapheme of width 2", () => {
    const rows = buildVisualRows(["🚀abc"], 4, -1, 0, 0);
    // 🚀=2, a=1, b=1 → "🚀ab" (4); c overflows → "c"
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text).toBe("🚀ab");
    expect(rows[1]!.text).toBe("c");
  });

  it("treats tab as tabWidth cells when wrapping", () => {
    // "\thi" with tabWidth=4, lineWidth=4 → tab fills row exactly, "hi" overflows to next row
    const rows = buildVisualRows(["\thi"], 4, -1, 0, 0, 4);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text).toBe("\t");
    expect(rows[1]!.text).toBe("hi");
  });

  it("tab+content fits within lineWidth when sum is small", () => {
    // "\tab" with tabWidth=2, lineWidth=4 → tab(2) + ab(2) = 4, fits in one row
    const rows = buildVisualRows(["\tab"], 4, -1, 0, 0, 2);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.text).toBe("\tab");
  });

  it("pads with virtual rows beyond logical lines for initialLineCount", () => {
    const rows = buildVisualRows(["a"], 3, 0, 0, 4);
    expect(rows).toHaveLength(4);
    expect(rows[0]!.isVirtualLine).toBe(false);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.isVirtualLine).toBe(true);
      expect(rows[i]!.text).toBe("");
    }
  });
});

describe("visualRowForCursor", () => {
  it("returns row index for cursor on line, no wrap", () => {
    const rows = buildVisualRows(["abc", "def"], 0, 1, 1, 0);
    expect(visualRowForCursor(rows, 1, 1, 0)).toBe(1);
    expect(visualRowForCursor(rows, 0, 0, 0)).toBe(0);
  });

  it("returns row index for cursor mid-row with wrap", () => {
    const rows = buildVisualRows(["abcdef"], 3, 0, 4, 0);
    // cursor at column 4 -> chunk 1 ("def"), col-in-row 1
    expect(visualRowForCursor(rows, 0, 4, 3)).toBe(1);
  });

  it("returns the appended extra row when cursor at width boundary at line end", () => {
    const rows = buildVisualRows(["abcdef"], 3, 0, 6, 0);
    expect(rows).toHaveLength(3);
    expect(visualRowForCursor(rows, 0, 6, 3)).toBe(2);
  });

  it("returns -1 when no matching row (defensive)", () => {
    const rows = buildVisualRows(["abc"], 0, 0, 0, 0);
    expect(visualRowForCursor(rows, 5, 0, 0)).toBe(-1);
  });

  it("ignores virtual padding rows", () => {
    const rows = buildVisualRows(["a"], 3, 0, 0, 4);
    expect(visualRowForCursor(rows, 0, 0, 3)).toBe(0);
    // Cursor on a line beyond logical lines should not pick a virtual row.
    expect(visualRowForCursor(rows, 2, 0, 3)).toBe(-1);
  });
});
