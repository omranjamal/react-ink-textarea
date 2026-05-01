import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea, LineNumber } from "../src/index.js";
import { Text } from "ink";
import React from "react";

describe("TextArea", () => {
  it("renders placeholder when empty and inactive", () => {
    const { lastFrame } = render(
      <TextArea
        isActive={false}
        onSubmit={() => {}}
        placeholder="Type here..."
      />,
    );

    expect(lastFrame()).toContain("Type here...");
  });

  it("renders cursor when active and empty", () => {
    const { lastFrame } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        placeholder="Type here..."
      />,
    );

    const frame = lastFrame()!;
    expect(frame).toContain("Type here...");
  });

  it("types characters when active", async () => {
    const onSubmit = vi.fn();
    const { stdin, lastFrame } = render(
      <TextArea isActive={true} onSubmit={onSubmit} />,
    );

    stdin.write("hello");

    // Wait for async useInput handling
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(lastFrame()).toContain("hello");
  });

  it("submits on Enter", async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(<TextArea isActive={true} onSubmit={onSubmit} />);

    stdin.write("test value");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\r");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onSubmit).toHaveBeenCalledWith("test value");
  });

  it("inserts newline on Ctrl+J", async () => {
    const { stdin, lastFrame } = render(
      <TextArea isActive={true} onSubmit={() => {}} />,
    );

    stdin.write("line1");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x0A"); // Ctrl+J
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("line2");
    await new Promise((resolve) => setTimeout(resolve, 50));

    const frame = lastFrame()!;
    expect(frame).toContain("line1");
    expect(frame).toContain("line2");
  });

  it("supports backspace", async () => {
    const { stdin, lastFrame } = render(
      <TextArea isActive={true} onSubmit={() => {}} />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x7F"); // Backspace
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).toContain("hell");
    expect(lastFrame()).not.toContain("hello");
  });

  it("does not accept input when inactive", () => {
    const { stdin, lastFrame } = render(
      <TextArea isActive={false} onSubmit={() => {}} />,
    );

    const before = lastFrame();
    stdin.write("hello");
    const after = lastFrame();

    expect(after).toBe(before);
  });

  it("renders line prefix when typing", async () => {
    const { stdin, lastFrame } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        linePrefix={(num) => <Text color="green">{`>${num + 1}< `}</Text>}
      />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 100));

    const frame = lastFrame()!;
    expect(frame).toContain(">1<");
    expect(frame).toContain("hello");
  });

  it("passes isActiveLine to linePrefix function", async () => {
    const linePrefix = vi.fn(() => <Text>{"> "}</Text>);
    const { stdin } = render(
      <TextArea isActive={true} onSubmit={() => {}} linePrefix={linePrefix} />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(linePrefix).toHaveBeenCalled();
    const lastCall = linePrefix.mock.calls[linePrefix.mock.calls.length - 1];
    expect(lastCall).toHaveLength(3);
    expect(typeof lastCall![2]).toBe("boolean");
  });

  it("highlights active line when highlightActiveLine is enabled", async () => {
    const { stdin, lastFrame } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        highlightActiveLine={true}
        activeLineColor="cyan"
      />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(lastFrame()).toContain("hello");
  });

  it("renders LineNumber component", () => {
    const { lastFrame } = render(
      <LineNumber lineNumber={0} totalLines={10} isActive={false} />,
    );

    expect(lastFrame()).toContain(" 1");
  });

  it("renders active LineNumber with active color", () => {
    const { lastFrame } = render(
      <LineNumber
        lineNumber={0}
        totalLines={10}
        isActive={true}
        activeColor="red"
      />,
    );

    expect(lastFrame()).toContain(" 1");
  });
});
