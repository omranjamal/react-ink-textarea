import { it, expect } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";
import type { TLabels, TStyles } from "../../src/index.js";

const labels: TLabels = [{ pattern: /\/ultra/g, label: "ultra" }];

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// NOTE: ink-testing-library renders without a TTY, so chalk strips all color
// from the output — the dynamic *color* is never visible in lastFrame(). We
// instead observe the style fn being re-invoked over time, which proves the
// timer-driven re-render loop runs (and stops when unfocused).
const makeStyles = (calls: { n: number }): TStyles => ({
  ultra: {
    fn: ({ meta }) => {
      calls.n += 1;
      const m = meta as { phase: number };
      return {
        color: "#ff0000",
        nextAfter: 30,
        nextMeta: { phase: m.phase + 1 },
      };
    },
    initialMeta: { phase: 0 },
  },
});

it("re-invokes the style fn over time while focused", async () => {
  const calls = { n: 0 };
  const { unmount } = render(
    <TextArea
      focus={true}
      onSubmit={() => {}}
      value="/ultra"
      cursorPosition={[0, 6]}
      onChange={() => {}}
      labels={labels}
      styles={makeStyles(calls)}
      disableCursorBlink={true}
    />,
  );

  await sleep(60);
  const early = calls.n;
  await sleep(250);
  const later = calls.n;
  unmount();

  expect(early).toBeGreaterThan(0); // rendered at least once
  expect(later).toBeGreaterThan(early); // timer kept re-rendering
}, 20000);

it("does not run the timer loop when unfocused", async () => {
  const calls = { n: 0 };
  const { unmount } = render(
    <TextArea
      focus={false}
      onSubmit={() => {}}
      value="/ultra"
      cursorPosition={[0, 6]}
      onChange={() => {}}
      labels={labels}
      styles={makeStyles(calls)}
      disableCursorBlink={true}
    />,
  );

  await sleep(80); // let initial measurement settle
  const settled = calls.n;
  await sleep(250);
  const after = calls.n;
  unmount();

  expect(settled).toBeGreaterThan(0); // still renders the label once
  expect(after).toBe(settled); // but no timer-driven re-renders
}, 20000);
