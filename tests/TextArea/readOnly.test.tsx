import { describe, expect, it, vi } from "vitest";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { useEffect, useRef } from "react";
import { TextArea, type TextAreaHandle } from "../../src/index.js";

vi.hoisted(() => {
  process.env.FORCE_COLOR = "3";
});

const waitForInput = () => new Promise((resolve) => setTimeout(resolve, 50));
const stripAnsi = (value: string) => value.replace(/\x1b\[[0-9;]*m/g, "");

const MUTATING_INPUTS = [
  ["typing", "!"],
  ["Backspace", "\x7f"],
  ["Delete", "\x1b[3~"],
  ["Ctrl+J", "\x0a"],
  ["Ctrl+W", "\x17"],
  ["Ctrl+U", "\x15"],
  ["Ctrl+K", "\x0b"],
  ["Ctrl+Z", "\x1a"],
  ["Ctrl+Y", "\x19"],
  ["Alt+Backspace", "\x1b\x7f"],
  ["bracketed paste", "\x1b[200~pasted text\x1b[201~"],
] as const;

describe("TextArea > readOnly", () => {
  it("dims content without dimming the cursor cell", () => {
    const { lastFrame } = render(
      <TextArea focus readOnly value="hi" onSubmit={() => {}} />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("\x1b[2m");
    expect(frame).toContain("\x1b[7mh\x1b[27m\x1b[2mi");
    expect(frame).not.toContain("\x1b[2m\x1b[7m");
  });

  it("passes readOnly to linePrefix", () => {
    const linePrefix = vi.fn(
      ({ readOnly }: { readOnly: boolean }) => (
        <Text>{readOnly ? "readonly> " : "> "}</Text>
      ),
    );
    const { lastFrame } = render(
      <TextArea
        focus
        readOnly
        value="hello"
        linePrefix={linePrefix}
        onSubmit={() => {}}
      />,
    );

    const frame = (lastFrame() ?? "").replace(/\x1b\[[0-9;]*m/g, "");
    expect(frame).toContain("readonly> hello");
    expect(linePrefix).toHaveBeenCalledWith(
      expect.objectContaining({ readOnly: true }),
    );
  });

  it.each(MUTATING_INPUTS)("blocks %s", async (_name, input) => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        readOnly
        value="hello world"
        cursorPosition={[0, 11]}
        onChange={onChange}
        onSubmit={() => {}}
      />,
    );

    stdin.write(input);
    await waitForInput();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("blocks undo when history already exists", async () => {
    const onChange = vi.fn();
    const editable = (
      <TextArea focus onChange={onChange} onSubmit={() => {}} />
    );
    const { stdin, rerender, lastFrame } = render(editable);

    stdin.write("a");
    await waitForInput();
    rerender(
      <TextArea focus readOnly onChange={onChange} onSubmit={() => {}} />,
    );
    onChange.mockClear();

    stdin.write("\x1a");
    await waitForInput();

    expect(onChange).not.toHaveBeenCalled();
    expect(stripAnsi(lastFrame() ?? "")).toContain("a");
  });

  it("blocks redo when redo history already exists", async () => {
    const onChange = vi.fn();
    const { stdin, rerender, lastFrame } = render(
      <TextArea focus onChange={onChange} onSubmit={() => {}} />,
    );

    stdin.write("a");
    await waitForInput();
    stdin.write("\x1a");
    await waitForInput();
    rerender(
      <TextArea focus readOnly onChange={onChange} onSubmit={() => {}} />,
    );
    onChange.mockClear();

    stdin.write("\x19");
    await waitForInput();

    expect(onChange).not.toHaveBeenCalled();
    expect(stripAnsi(lastFrame() ?? "")).not.toContain("a");
  });

  it("keeps cursor navigation active", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        readOnly
        value="hello"
        cursorPosition={[0, 5]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        onSubmit={() => {}}
      />,
    );

    stdin.write("\x1b[D");
    await waitForInput();

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 4],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("treats Down on the final row as an immediate read-only boundary", async () => {
    const onChange = vi.fn();
    const onLastLineDown = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        readOnly
        value="hello"
        cursorPosition={[0, 5]}
        onChange={onChange}
        onLastLineDown={onLastLineDown}
        onSubmit={() => {}}
      />,
    );

    stdin.write("\x1b[B");
    await waitForInput();

    expect(onChange).not.toHaveBeenCalled();
    expect(onLastLineDown).toHaveBeenCalledOnce();
  });

  it("keeps editable Down behavior unchanged before the newline limit", async () => {
    const onChange = vi.fn();
    const onLastLineDown = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        value="hello"
        cursorPosition={[0, 5]}
        autoNewLineLimit={3}
        onChange={onChange}
        onLastLineDown={onLastLineDown}
        onSubmit={() => {}}
      />,
    );

    stdin.write("\x1b[B");
    await waitForInput();

    expect(onChange).toHaveBeenCalledWith("hello\n");
    expect(onLastLineDown).not.toHaveBeenCalled();
  });

  it("moves to the end on a read-only Down boundary without a callback", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        readOnly
        value="hello"
        cursorPosition={[0, 2]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        onSubmit={() => {}}
      />,
    );

    stdin.write("\x1b[B");
    await waitForInput();

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 5],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("fires the read-only Down boundary after wrapped content", async () => {
    const onLastLineDown = vi.fn();
    const value = "x".repeat(200);
    const { stdin } = render(
      <TextArea
        focus
        readOnly
        value={value}
        cursorPosition={[0, value.length]}
        onLastLineDown={onLastLineDown}
        onSubmit={() => {}}
      />,
    );

    await waitForInput();
    stdin.write("\x1b[B");
    await waitForInput();

    expect(onLastLineDown).toHaveBeenCalledOnce();
  });

  it("allows submit and Tab callbacks", async () => {
    const onSubmit = vi.fn();
    const onTab = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        readOnly
        value="hello"
        onSubmit={onSubmit}
        onTab={onTab}
      />,
    );

    stdin.write("\r");
    stdin.write("\t");
    await waitForInput();

    expect(onSubmit).toHaveBeenCalledWith("hello");
    expect(onTab).toHaveBeenCalledWith(false);
  });

  it("makes ref.insert a no-op", async () => {
    const onChange = vi.fn();
    const App = () => {
      const ref = useRef<TextAreaHandle>(null);
      useEffect(() => ref.current?.insert("blocked"), []);
      return (
        <TextArea
          ref={ref}
          focus
          readOnly
          value="hello"
          onChange={onChange}
          onSubmit={() => {}}
        />
      );
    };

    render(<App />);
    await waitForInput();

    expect(onChange).not.toHaveBeenCalled();
  });
});
