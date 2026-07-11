import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";
import { settle } from "../_util/wait.js";

describe("TextArea > Undo/Redo", () => {
  it("Ctrl+Z reverts last character", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} undoGroupDelay={0} />,
    );

    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("b");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).toContain("ab");

    stdin.write("\x1a"); // Ctrl+Z
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).toContain("a");
    expect(lastFrame()).not.toContain("ab");
  });

  it("Ctrl+Z is no-op with empty stack", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea focus={true} onSubmit={() => {}} onChange={onChange} />,
    );

    onChange.mockClear();

    stdin.write("\x1a");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("multiple undos restore each prior state", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} undoGroupDelay={0} />,
    );

    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("b");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("c");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1a");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x1a");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x1a");
    await settle(lastFrame);

    expect(lastFrame()).not.toMatch(/[abc]/);
  });

  it("maxUndo=1 keeps only one undo entry", async () => {
    const { stdin, lastFrame } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        maxUndo={1}
        undoGroupDelay={0}
      />,
    );

    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("b");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("c");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1a");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x1a");
    await settle(lastFrame);

    const frame = lastFrame()!;
    expect(frame).not.toContain("abc");
  });

  it("undo groups inserts with undoGroupDelay=0 as separate entries", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} undoGroupDelay={0} />,
    );

    stdin.write("x");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("y");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1a");
    await settle(lastFrame);

    expect(lastFrame()).toContain("x");
    expect(lastFrame()).not.toContain("y");
  });

  it("Ctrl+Y redoes an undone character", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} undoGroupDelay={0} />,
    );

    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("b");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1a"); // Ctrl+Z
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("a");
    expect(lastFrame()).not.toContain("ab");

    stdin.write("\x19"); // Ctrl+Y
    await settle(lastFrame);
    expect(lastFrame()).toContain("ab");
  });

  it("Ctrl+Y is no-op with empty redo stack", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea focus={true} onSubmit={() => {}} onChange={onChange} />,
    );

    onChange.mockClear();

    stdin.write("\x19");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("a fresh edit after undo clears the redo stack", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} undoGroupDelay={0} />,
    );

    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("b");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1a"); // Ctrl+Z -> "a"
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("c"); // fresh edit -> "ac", redo cleared
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("ac");

    stdin.write("\x19"); // Ctrl+Y -> no-op
    await settle(lastFrame);
    expect(lastFrame()).toContain("ac");
    expect(lastFrame()).not.toContain("ab");
  });

  it("multiple undos then redos round-trip the full state", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} undoGroupDelay={0} />,
    );

    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("b");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("c");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1a"); // -> ab
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x1a"); // -> a
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x1a"); // -> ""
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).not.toMatch(/[abc]/);

    stdin.write("\x19"); // -> a
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x19"); // -> ab
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x19"); // -> abc
    await settle(lastFrame);
    expect(lastFrame()).toContain("abc");
  });
});
