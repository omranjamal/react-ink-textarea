import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";

describe("TextArea > Controlled Mode", () => {
  it("renders controlled value", () => {
    const { lastFrame } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="controlled text"
        cursorPosition={[0, 17]}
        onChange={() => {}}
      />,
    );

    expect(lastFrame()).toContain("controlled");
    expect(lastFrame()).toContain("text");
  });

  it("calls onChange when typing in controlled mode", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value=""
        onChange={onChange}
      />,
    );

    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("respects cursorPosition prop", () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="hello"
        cursorPosition={[0, 3]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("\x1b[D"); // Left arrow

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 2],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("calls onCursorChange when cursor moves in controlled mode", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="hello"
        cursorPosition={[0, 5]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("\x1b[D"); // Left arrow
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 4],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("does not update internal state when value prop is provided", async () => {
    const onChange = vi.fn();
    const { stdin, lastFrame } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="fixed"
        cursorPosition={[0, 5]}
        onChange={onChange}
      />,
    );

    const beforeFrame = lastFrame();

    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 50));

    const afterFrame = lastFrame();
    expect(afterFrame).toBe(beforeFrame);
    expect(onChange).toHaveBeenCalledWith("fixeda");
  });

  it("calls onChange with correct value when deleting in controlled mode", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="hello"
        cursorPosition={[0, 5]}
        onChange={onChange}
      />,
    );

    stdin.write("\x7F"); // Backspace
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenCalledWith("hell");
  });

  it("calls onChange with correct value when inserting newline in controlled mode", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="line1"
        cursorPosition={[0, 5]}
        onChange={onChange}
      />,
    );

    stdin.write("\x0A"); // Ctrl+J
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenCalledWith("line1\n");
  });

  it("clamps cursor to last line when line exceeds available lines", async () => {
    const onCursorChange = vi.fn();
    render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="hello"
        cursorPosition={[100, 0]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 5],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("clamps cursor to last column when column exceeds line length", async () => {
    const onCursorChange = vi.fn();
    render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="hi"
        cursorPosition={[0, 100]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 2],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("clamps negative line to 0", async () => {
    const onCursorChange = vi.fn();
    render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="hello"
        cursorPosition={[-5, 2]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 2],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("clamps negative column to 0", async () => {
    const onCursorChange = vi.fn();
    render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="hello"
        cursorPosition={[0, -10]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 0],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("handles Infinity as line value", async () => {
    const onCursorChange = vi.fn();
    render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value={"line1\nline2\nline3"}
        cursorPosition={[Infinity, 0]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalledWith(
      [2, 5],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("handles Infinity as column value", async () => {
    const onCursorChange = vi.fn();
    render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value="test"
        cursorPosition={[0, Infinity]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 4],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("normalizes CRLF in controlled value", async () => {
    const { lastFrame } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value={"a\r\nb\r\nc"}
        cursorPosition={[2, 0]}
        onChange={() => {}}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const frame = lastFrame() ?? "";
    expect(frame).toContain("a");
    expect(frame).toContain("b");
    expect(frame).toContain("c");
    expect(frame).not.toContain("\r");
  });

  it("normalizes lone CR (old-Mac line endings) in controlled value", async () => {
    const { lastFrame } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value={"a\rb"}
        cursorPosition={[1, 0]}
        onChange={() => {}}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const frame = lastFrame() ?? "";
    expect(frame).toContain("a");
    expect(frame).toContain("b");
    expect(frame).not.toContain("\r");
  });

  it("CRLF cursor reaches normalized line via right arrow", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value={"a\r\nb"}
        cursorPosition={[0, 1]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1b[C"); // Right arrow → newline
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalledWith(
      [1, 0],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("correctly positions cursor on specific line in multi-line text", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value={"line1\nline2\nline3"}
        cursorPosition={[1, 3]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1b[C"); // Right arrow
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenLastCalledWith(
      [1, 4],
      expect.any(String),
      expect.any(Number),
    );
  });
});
