import { it, expect } from "vitest";
import { render } from "ink-testing-library";
import { useState, type ReactNode } from "react";
import { TextArea } from "../../src/index.js";
import type { TLinePrefixProps } from "../../src/index.js";
import { Text } from "ink";

// Repro for the navigation loop: a long wrapping line whose prefix width
// depends on the caret's sub-row (isActiveLine). Arrow-key navigation moves the
// active sub-row, changing widths and re-wrapping. The measurement guard must
// keep this bounded (no "Maximum update depth").
const Host = (): ReactNode => {
  const [value, setValue] = useState("x".repeat(300));
  const [cursor, setCursor] = useState<[number, number]>([0, 0]);
  return (
    <TextArea
      focus={true}
      onSubmit={() => {}}
      value={value}
      cursorPosition={cursor}
      onChange={setValue}
      onCursorChange={(p) => setCursor(p)}
      linePrefix={(p: TLinePrefixProps) => (
        <Text>{p.isActiveLine ? "-".repeat(15) + "> " : "| "}</Text>
      )}
    />
  );
};

it("stays bounded navigating a wrapping + varying line", async () => {
  const { stdin, lastFrame } = render(<Host />);
  await new Promise((r) => setTimeout(r, 60));

  for (let i = 0; i < 4; i++) {
    stdin.write("\x1b[B"); // Down
    await new Promise((r) => setTimeout(r, 60));
  }
  for (let i = 0; i < 4; i++) {
    stdin.write("\x1b[A"); // Up
    await new Promise((r) => setTimeout(r, 60));
  }

  // Reaching here means it never looped. Confirm it also settled (stable frame).
  const a = lastFrame() ?? "";
  await new Promise((r) => setTimeout(r, 60));
  const b = lastFrame() ?? "";
  expect(a.length).toBeGreaterThan(0);
  expect(b).toBe(a);
}, 20000);
