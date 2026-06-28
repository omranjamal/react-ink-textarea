import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";

describe("TextArea > Keybindings", () => {
  it("Ctrl+A moves cursor to start of line", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x01"); // Ctrl+A
    await new Promise((resolve) => setTimeout(resolve, 50));

    const lastCall =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1]?.[0];
    expect(lastCall).toEqual([0, 0]);
  });

  it("Ctrl+E moves cursor to end of line", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x01");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x05"); // Ctrl+E
    await new Promise((resolve) => setTimeout(resolve, 50));

    const lastCall =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1]?.[0];
    expect(lastCall).toEqual([0, 5]);
  });

  it("Ctrl+W deletes word before cursor", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} />,
    );

    stdin.write("hello world");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x17"); // Ctrl+W
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).toContain("hello ");
    expect(lastFrame()).not.toContain("world");
  });

  it("Ctrl+U deletes to start of current line", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} />,
    );

    stdin.write("hello world");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x15"); // Ctrl+U
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).not.toContain("hello");
    expect(lastFrame()).not.toContain("world");
  });

  it("Ctrl+U at start of non-first line merges with previous", async () => {
    const onChange = vi.fn();
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onChange={onChange}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("ab");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x0A");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("cd");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x01"); // Ctrl+A → start of line 2
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x15"); // Ctrl+U
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenLastCalledWith("abcd");
    const lastCursor =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1]?.[0];
    expect(lastCursor).toEqual([0, 2]);
  });

  it("Ctrl+U at start of empty line removes preceding newline", async () => {
    const onChange = vi.fn();
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onChange={onChange}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("ab");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x0A");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x15"); // Ctrl+U at start of empty line 2
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenLastCalledWith("ab");
    const lastCursor =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1]?.[0];
    expect(lastCursor).toEqual([0, 2]);
  });

  it("Ctrl+U at position 0 is a no-op and does not fire boundary navigation", async () => {
    const onFirstCharacterLeft = vi.fn();
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onChange={onChange}
        onFirstCharacterLeft={onFirstCharacterLeft}
      />,
    );

    stdin.write("\x15"); // Ctrl+U at empty buffer
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onFirstCharacterLeft).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Cmd+Backspace (legacy \\x15) at position 0 does not fire boundary navigation", async () => {
    const onFirstCharacterLeft = vi.fn();
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onChange={onChange}
        onFirstCharacterLeft={onFirstCharacterLeft}
      />,
    );

    stdin.write("\x15"); // Ghostty maps Cmd+Backspace to legacy Ctrl+U
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onFirstCharacterLeft).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Cmd+Backspace (super) deletes to start of current line", async () => {
    const onCursorChange = vi.fn();
    const { stdin, lastFrame } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("hello world");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1b[127;9u"); // kitty: Backspace + super (Cmd)
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).not.toContain("hello");
    const lastCursor =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1]?.[0];
    expect(lastCursor).toEqual([0, 0]);
  });

  it("Ctrl+K deletes to end of line", async () => {
    const onCursorChange = vi.fn();
    const { stdin, lastFrame } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("hello world");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x01");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x0b"); // Ctrl+K
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).not.toContain("hello");
    expect(lastFrame()).not.toContain("world");
  });

  it("Ctrl+K at end of line joins next line", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onChange={onChange}
      />,
    );

    stdin.write("ab");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x0A");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("cd");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x01"); // Ctrl+A → start of line 2
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x1b[D"); // Left arrow → end of line 1
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x0b"); // Ctrl+K
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenLastCalledWith("abcd");
  });

  it("Opt+Left jumps to previous word boundary", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("hello world");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1bb");
    await new Promise((resolve) => setTimeout(resolve, 50));

    const lastCall =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1]?.[0];
    expect(lastCall).toEqual([0, 6]);
  });

  it("Opt+Right jumps to next word boundary", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write("hello world");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x01");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1bf");
    await new Promise((resolve) => setTimeout(resolve, 50));

    const lastCall =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1]?.[0];
    expect(lastCall).toEqual([0, 6]);
  });

  it("Tab without onTab does not modify value", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onChange={onChange}
      />,
    );

    stdin.write("ab");
    await new Promise((resolve) => setTimeout(resolve, 50));
    onChange.mockClear();

    stdin.write("\t");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("Tab fires onTab callback with shift=false", async () => {
    const onTab = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onTab={onTab}
      />,
    );

    stdin.write("\t");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onTab).toHaveBeenCalledTimes(1);
    expect(onTab).toHaveBeenCalledWith(false);
  });

  it("Shift+Tab fires onTab callback with shift=true", async () => {
    const onTab = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onTab={onTab}
      />,
    );

    stdin.write("\x1b[Z");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onTab).toHaveBeenCalledTimes(1);
    expect(onTab).toHaveBeenCalledWith(true);
  });

  it("fires onFirstCharacterLeft when left arrow pressed at cursor 0", async () => {
    const onFirstCharacterLeft = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        value="abc"
        cursorPosition={[0, 0]}
        onChange={() => {}}
        onFirstCharacterLeft={onFirstCharacterLeft}
      />,
    );
    await new Promise((r) => setTimeout(r, 50));
    stdin.write("\x1b[D");
    await new Promise((r) => setTimeout(r, 50));
    expect(onFirstCharacterLeft).toHaveBeenCalledTimes(1);
  });

  it("does not fire onFirstCharacterLeft when left arrow can move", async () => {
    const onFirstCharacterLeft = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        value="abc"
        cursorPosition={[0, 1]}
        onChange={() => {}}
        onFirstCharacterLeft={onFirstCharacterLeft}
      />,
    );
    await new Promise((r) => setTimeout(r, 50));
    stdin.write("\x1b[D");
    await new Promise((r) => setTimeout(r, 50));
    expect(onFirstCharacterLeft).not.toHaveBeenCalled();
  });

  it("fires onLastCharacterRight when right arrow pressed at end of value", async () => {
    const onLastCharacterRight = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        value="abc"
        cursorPosition={[0, 3]}
        onChange={() => {}}
        onLastCharacterRight={onLastCharacterRight}
      />,
    );
    await new Promise((r) => setTimeout(r, 50));
    stdin.write("\x1b[C");
    await new Promise((r) => setTimeout(r, 50));
    expect(onLastCharacterRight).toHaveBeenCalledTimes(1);
  });

  it("does not fire onLastCharacterRight when right arrow can move", async () => {
    const onLastCharacterRight = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        value="abc"
        cursorPosition={[0, 0]}
        onChange={() => {}}
        onLastCharacterRight={onLastCharacterRight}
      />,
    );
    await new Promise((r) => setTimeout(r, 50));
    stdin.write("\x1b[C");
    await new Promise((r) => setTimeout(r, 50));
    expect(onLastCharacterRight).not.toHaveBeenCalled();
  });

  it("does not fire onFirstCharacterLeft on multi-line wrap to previous line", async () => {
    const onFirstCharacterLeft = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        value={"ab\ncd"}
        cursorPosition={[1, 0]}
        onChange={() => {}}
        onFirstCharacterLeft={onFirstCharacterLeft}
      />,
    );
    await new Promise((r) => setTimeout(r, 50));
    stdin.write("\x1b[D");
    await new Promise((r) => setTimeout(r, 50));
    expect(onFirstCharacterLeft).not.toHaveBeenCalled();
  });
});

describe("TextArea > keybindings flag map", () => {
  const wait = (ms = 60) => new Promise((r) => setTimeout(r, ms));

  it("Enter: disabled keybindings.Enter blocks onSubmit", async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={onSubmit}
        keybindings={{ Enter: false }}
      />,
    );
    await wait();
    stdin.write("\r");
    await wait();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Ctrl+J chord is hard to verify in ink-testing-library: raw \x0a is
  // delivered as plain input ("\n") and falls through to text insertion,
  // not the chord branch. The chord-gating code path is structurally
  // identical to Ctrl+Enter / Shift+Enter / Alt+Enter (verified below).

  it("Ctrl+Enter: disabled blocks newline insertion", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ "Ctrl+Enter": false }}
      />,
    );
    await wait();
    stdin.write("ab");
    await wait();
    onChange.mockClear();
    stdin.write("\x1b[27;5;13~");
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Shift+Enter: disabled blocks newline insertion", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ "Shift+Enter": false }}
      />,
    );
    await wait();
    stdin.write("ab");
    await wait();
    onChange.mockClear();
    stdin.write("\x1b[27;2;13~");
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Alt+Enter: disabled blocks newline insertion", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ "Alt+Enter": false }}
      />,
    );
    await wait();
    stdin.write("ab");
    await wait();
    onChange.mockClear();
    stdin.write("\x1b[27;3;13~");
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Up: disabled blocks cursor up", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        value={"ab\ncd"}
        cursorPosition={[1, 1]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        keybindings={{ Up: false }}
      />,
    );
    await wait();
    onCursorChange.mockClear();
    stdin.write("\x1b[A");
    await wait();
    expect(onCursorChange).not.toHaveBeenCalled();
  });

  it("Down: disabled blocks cursor down", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        value={"ab\ncd"}
        cursorPosition={[0, 1]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        keybindings={{ Down: false }}
      />,
    );
    await wait();
    onCursorChange.mockClear();
    stdin.write("\x1b[B");
    await wait();
    expect(onCursorChange).not.toHaveBeenCalled();
  });

  it("Left: disabled blocks cursor left", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        value="abc"
        cursorPosition={[0, 2]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        keybindings={{ Left: false }}
      />,
    );
    await wait();
    onCursorChange.mockClear();
    stdin.write("\x1b[D");
    await wait();
    expect(onCursorChange).not.toHaveBeenCalled();
  });

  it("Right: disabled blocks cursor right", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        value="abc"
        cursorPosition={[0, 1]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        keybindings={{ Right: false }}
      />,
    );
    await wait();
    onCursorChange.mockClear();
    stdin.write("\x1b[C");
    await wait();
    expect(onCursorChange).not.toHaveBeenCalled();
  });

  it("Alt+B: disabled blocks prev-word jump", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        value="hello world"
        cursorPosition={[0, 11]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        keybindings={{ "Alt+B": false }}
      />,
    );
    await wait();
    onCursorChange.mockClear();
    stdin.write("\x1bb");
    await wait();
    expect(onCursorChange).not.toHaveBeenCalled();
  });

  it("Alt+F: disabled blocks next-word jump", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        value="hello world"
        cursorPosition={[0, 0]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        keybindings={{ "Alt+F": false }}
      />,
    );
    await wait();
    onCursorChange.mockClear();
    stdin.write("\x1bf");
    await wait();
    expect(onCursorChange).not.toHaveBeenCalled();
  });

  it("Ctrl+A: disabled blocks line-start jump", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        value="hello"
        cursorPosition={[0, 5]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        keybindings={{ "Ctrl+A": false }}
      />,
    );
    await wait();
    onCursorChange.mockClear();
    stdin.write("\x01");
    await wait();
    expect(onCursorChange).not.toHaveBeenCalled();
  });

  it("Ctrl+E: disabled blocks line-end jump", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        value="hello"
        cursorPosition={[0, 0]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        keybindings={{ "Ctrl+E": false }}
      />,
    );
    await wait();
    onCursorChange.mockClear();
    stdin.write("\x05");
    await wait();
    expect(onCursorChange).not.toHaveBeenCalled();
  });

  it("Ctrl+W: disabled blocks delete-prev-word", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ "Ctrl+W": false }}
      />,
    );
    await wait();
    stdin.write("hello world");
    await wait();
    onChange.mockClear();
    stdin.write("\x17");
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Ctrl+U: disabled blocks delete-to-line-start", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ "Ctrl+U": false }}
      />,
    );
    await wait();
    stdin.write("hello");
    await wait();
    onChange.mockClear();
    stdin.write("\x15");
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Ctrl+K: disabled blocks delete-to-line-end", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ "Ctrl+K": false }}
      />,
    );
    await wait();
    stdin.write("hello");
    await wait();
    stdin.write("\x01"); // Ctrl+A → cursor to line start
    await wait();
    onChange.mockClear();
    stdin.write("\x0b");
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Backspace: disabled blocks delete-prev-grapheme", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ Backspace: false }}
      />,
    );
    await wait();
    stdin.write("ab");
    await wait();
    onChange.mockClear();
    stdin.write("\x7f");
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Delete: disabled blocks delete-prev-grapheme via Delete key", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ Delete: false }}
      />,
    );
    await wait();
    stdin.write("ab");
    await wait();
    onChange.mockClear();
    stdin.write("\x1b[3~"); // Delete key
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Alt+Backspace: disabled blocks delete-prev-word via meta", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ "Alt+Backspace": false }}
      />,
    );
    await wait();
    stdin.write("hello world");
    await wait();
    onChange.mockClear();
    stdin.write("\x1b\x7f");
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Ctrl+Z: disabled blocks undo", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ "Ctrl+Z": false }}
      />,
    );
    await wait();
    stdin.write("ab");
    await wait();
    onChange.mockClear();
    stdin.write("\x1a");
    await wait();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("merges over defaults: disabling Ctrl+Z does not disable Ctrl+W", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        onChange={onChange}
        keybindings={{ "Ctrl+Z": false }}
      />,
    );
    await wait();
    stdin.write("hello world");
    await wait();
    onChange.mockClear();
    stdin.write("\x17"); // Ctrl+W deletes "world"
    await wait();
    expect(onChange).toHaveBeenCalled();
    const lastVal = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(lastVal).toBe("hello ");
  });

  it("disableArrowNavigation=true force-disables Up even if keybindings.Up=true", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus
        onSubmit={() => {}}
        value={"ab\ncd"}
        cursorPosition={[1, 1]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
        disableArrowNavigation={true}
        keybindings={{ Up: true }}
      />,
    );
    await wait();
    onCursorChange.mockClear();
    stdin.write("\x1b[A");
    await wait();
    expect(onCursorChange).not.toHaveBeenCalled();
  });
});
