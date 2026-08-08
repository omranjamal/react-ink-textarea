import { it, expect } from "vitest";
import { render } from "ink-testing-library";
import { useState, useEffect, type ReactNode } from "react";
import { TextArea } from "../../src/index.js";
import type { TLinePrefixProps } from "../../src/index.js";
import { Text } from "ink";

// Mirrors the example: an animation (setInterval) grows a prefix on the caret's
// sub-row while the user navigates a wrapping line.
const Host = (): ReactNode => {
  const [value, setValue] = useState("short\n" + "x".repeat(260));
  const [cursor, setCursor] = useState<[number, number]>([0, 0]);
  const [dashes, setDashes] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDashes((n) => (n + 1) % 20), 40);
    return () => clearInterval(id);
  }, []);
  return (
    <TextArea
      focus={true}
      onSubmit={() => {}}
      value={value}
      cursorPosition={cursor}
      onChange={setValue}
      onCursorChange={(p) => setCursor(p)}
      linePrefix={(p: TLinePrefixProps) =>
        p.isActiveLine ? (
          <Text>{"-".repeat(dashes) + "> "}</Text>
        ) : (
          <Text>{"| "}</Text>
        )
      }
    />
  );
};

it("does not loop with animation + navigation on a wrapping line", async () => {
  const { stdin, lastFrame } = render(<Host />);
  await new Promise((r) => setTimeout(r, 100));
  for (let i = 0; i < 6; i++) {
    stdin.write("\x1b[B"); // Down
    await new Promise((r) => setTimeout(r, 80));
  }
  for (let i = 0; i < 6; i++) {
    stdin.write("\x1b[A"); // Up
    await new Promise((r) => setTimeout(r, 80));
  }
  expect((lastFrame() ?? "").length).toBeGreaterThan(0);
}, 20000);
