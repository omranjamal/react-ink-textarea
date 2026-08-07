import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";
import type { TLinePrefixProps, TLineSuffixProps } from "../../src/index.js";
import { Text } from "ink";

// Counts how many visual rows (chunks) each logical line wrapped into, based
// on the per-row decoration calls the component makes.
const rowsPerLine = (
  calls: { 0: TLinePrefixProps }[],
): Map<number, number> => {
  const max = new Map<number, number>();
  for (const call of calls) {
    const p = call[0];
    if (p.isVirtualLine) continue;
    const prev = max.get(p.lineNumber) ?? -1;
    if (p.continuationIndex > prev) max.set(p.lineNumber, p.continuationIndex);
  }
  // continuationIndex is 0-based; row count is max + 1.
  const out = new Map<number, number>();
  for (const [line, idx] of max) out.set(line, idx + 1);
  return out;
};

describe("TextArea per-line prefix/suffix width", () => {
  it("wraps each line to its own linePrefix width", async () => {
    const linePrefix = vi.fn((props: TLinePrefixProps) => (
      // Line 1 gets a much wider gutter than line 0.
      <Text>{props.lineNumber === 1 ? "#".repeat(40) + " " : "> "}</Text>
    ));
    const long = "x".repeat(180);
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        value={`${long}\n${long}`}
        linePrefix={linePrefix}
      />,
    );

    // Nudge so a measurement pass runs and the component re-wraps.
    stdin.write(" ");
    await new Promise((resolve) => setTimeout(resolve, 250));

    const rows = rowsPerLine(linePrefix.mock.calls as never);
    const line0 = rows.get(0) ?? 0;
    const line1 = rows.get(1) ?? 0;
    // The wider-gutter line has less room for text, so it must wrap into
    // strictly more visual rows than the narrow-gutter line.
    expect(line0).toBeGreaterThan(0);
    expect(line1).toBeGreaterThan(line0);
  });

  it("wraps each line to its own lineSuffix width", async () => {
    const lineSuffix = vi.fn((props: TLineSuffixProps) => (
      <Text>{props.lineNumber === 1 ? " " + "@".repeat(40) : " ."}</Text>
    ));
    const long = "y".repeat(180);
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        value={`${long}\n${long}`}
        lineSuffix={lineSuffix}
      />,
    );

    stdin.write(" ");
    await new Promise((resolve) => setTimeout(resolve, 250));

    const rows = rowsPerLine(lineSuffix.mock.calls as never);
    const line0 = rows.get(0) ?? 0;
    const line1 = rows.get(1) ?? 0;
    expect(line0).toBeGreaterThan(0);
    expect(line1).toBeGreaterThan(line0);
  });

  it("wraps only the sub-row whose prefix is wider (per-chunk)", async () => {
    // Count content rows (containing the filler char), polling until the
    // per-sub-row measurement has settled (it converges over a few frames).
    const contentRows = (frame: string): number =>
      frame.split("\n").filter((l) => l.includes("x")).length;
    // Per-sub-row measurement converges over several frames (1 -> N -> final),
    // so wait for a *sustained* stable value to avoid catching a transient.
    const settledRows = async (frameFn: () => string | undefined) => {
      let prev = -1;
      let stable = 0;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 50));
        const n = contentRows(frameFn() ?? "");
        if (n === prev && n > 0) {
          if (++stable >= 5) return n; // ~250ms unchanged
        } else {
          stable = 0;
        }
        prev = n;
      }
      return prev;
    };

    const wideAll = () => <Text>{"#".repeat(40) + " "}</Text>;
    const wideFirstOnly = (p: TLinePrefixProps) => (
      // Wide arrow only on the first sub-row; continuations keep a plain gutter.
      <Text>{p.continuationIndex === 0 ? "#".repeat(40) + " " : "| "}</Text>
    );
    const long = "x".repeat(220);

    const a = render(
      <TextArea focus={true} onSubmit={() => {}} value={long} linePrefix={wideAll} />,
    );
    a.stdin.write(" ");
    const rowsAll = await settledRows(a.lastFrame);

    const b = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        value={long}
        linePrefix={wideFirstOnly}
      />,
    );
    b.stdin.write(" ");
    const rowsFirst = await settledRows(b.lastFrame);

    // Continuations regain full width when only sub-row 0 carries the wide
    // prefix, so the line needs strictly fewer rows than the all-wide case.
    expect(rowsAll).toBeGreaterThan(1);
    expect(rowsFirst).toBeGreaterThan(1);
    expect(rowsFirst).toBeLessThan(rowsAll);
  });

  it("keeps a constant-width prefix wrapping uniformly across lines", async () => {
    const linePrefix = vi.fn(() => <Text>{">> "}</Text>);
    const long = "z".repeat(180);
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        value={`${long}\n${long}`}
        linePrefix={linePrefix}
      />,
    );

    stdin.write(" ");
    await new Promise((resolve) => setTimeout(resolve, 250));

    const rows = rowsPerLine(linePrefix.mock.calls as never);
    // Both equal-length lines share the same gutter width, so they wrap into
    // the same number of rows.
    expect(rows.get(0)).toBe(rows.get(1));
    expect(rows.get(0)).toBeGreaterThan(1);
  });
});
