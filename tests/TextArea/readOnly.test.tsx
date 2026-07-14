import { describe, expect, it, vi } from "vitest";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { useEffect, useRef } from "react";
import { TextArea, type TextAreaHandle } from "../../src/index.js";

const waitForInput = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("TextArea > readOnly", () => {
  it("dims content and passes readOnly to linePrefix", () => {
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

  it("blocks typing, deletion, and newline insertion", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        readOnly
        value="hello"
        cursorPosition={[0, 5]}
        onChange={onChange}
        onSubmit={() => {}}
      />,
    );

    stdin.write("!");
    stdin.write("\x7f");
    stdin.write("\x0a");
    await waitForInput();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("blocks bracketed paste", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea focus readOnly onChange={onChange} onSubmit={() => {}} />,
    );

    stdin.write("\x1b[200~pasted text\x1b[201~");
    await waitForInput();

    expect(onChange).not.toHaveBeenCalled();
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

  it("does not create a line when Down is pressed at the end", async () => {
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
