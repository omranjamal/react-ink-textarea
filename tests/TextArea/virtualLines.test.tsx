import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";
import type { TLinePrefixProps } from "../../src/index.js";
import { Text } from "ink";

describe("TextArea > Virtual Line Detection", () => {
  it("marks initial padding lines as virtual when no content exists", async () => {
    const linePrefix = vi.fn((_props: TLinePrefixProps) => <Text>{"> "}</Text>);
    render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        linePrefix={linePrefix}
        initialLineCount={4}
        placeholder="Line1\nLine2\nLine3\nLine4"
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const line0Call = linePrefix.mock.calls.find(
      (call) => call[0].lineNumber === 0,
    );
    expect(line0Call).toBeDefined();
    expect(line0Call![0].isVirtualLine).toBe(false);

    for (let i = 1; i < 4; i++) {
      const lineCall = linePrefix.mock.calls.find(
        (call) => call[0].lineNumber === i,
      );
      expect(lineCall).toBeDefined();
      expect(lineCall![0].isVirtualLine).toBe(true);
    }
  });

  it("marks lines created by down navigation as real", async () => {
    const linePrefix = vi.fn((_props: TLinePrefixProps) => <Text>{"> "}</Text>);
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        linePrefix={linePrefix}
        initialLineCount={4}
      />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 50));

    linePrefix.mockClear();

    stdin.write("\x1b[B");
    await new Promise((resolve) => setTimeout(resolve, 50));

    const calls = linePrefix.mock.calls;
    const line1Call = calls.find((call) => call[0].lineNumber === 1);
    expect(line1Call).toBeDefined();
    expect(line1Call![0].isVirtualLine).toBe(false);
  });

  it("marks lines with content as non-virtual", async () => {
    const linePrefix = vi.fn((_props: TLinePrefixProps) => <Text>{"> "}</Text>);
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        linePrefix={linePrefix}
        initialLineCount={4}
      />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 50));

    linePrefix.mockClear();

    stdin.write("\x0A");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("world");
    await new Promise((resolve) => setTimeout(resolve, 50));

    const line1Call = linePrefix.mock.calls.find(
      (call) => call[0].lineNumber === 1,
    );
    expect(line1Call).toBeDefined();
    expect(line1Call![0].isVirtualLine).toBe(false);
  });

  it("correctly identifies virtual vs real lines in mixed state", async () => {
    const linePrefix = vi.fn((_props: TLinePrefixProps) => <Text>{"> "}</Text>);
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        linePrefix={linePrefix}
        initialLineCount={6}
      />,
    );

    stdin.write("content");
    await new Promise((resolve) => setTimeout(resolve, 100));

    stdin.write("\x1b[B");
    await new Promise((resolve) => setTimeout(resolve, 100));
    stdin.write("\x1b[B");
    await new Promise((resolve) => setTimeout(resolve, 100));

    linePrefix.mockClear();

    stdin.write("\x1b[A");
    await new Promise((resolve) => setTimeout(resolve, 100));

    const calls = linePrefix.mock.calls;

    const line0Call = calls.find((call) => call[0].lineNumber === 0);
    expect(line0Call![0].isVirtualLine).toBe(false);

    for (let i = 1; i <= 2; i++) {
      const lineCall = calls.find((call) => call[0].lineNumber === i);
      expect(lineCall).toBeDefined();
      expect(lineCall![0].isVirtualLine).toBe(false);
    }

    for (let i = 3; i < 6; i++) {
      const lineCall = calls.find((call) => call[0].lineNumber === i);
      expect(lineCall).toBeDefined();
      expect(lineCall![0].isVirtualLine).toBe(true);
    }
  }, 10000);
});
