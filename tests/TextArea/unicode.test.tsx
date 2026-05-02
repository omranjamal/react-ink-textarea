import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";

describe("TextArea > unicode (graphemes)", () => {
  it("backspace deletes whole flag emoji", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value={"a🇯🇵"}
        cursorPosition={[0, 5]}
        onChange={onChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    onChange.mockClear();

    stdin.write("\x7F"); // Backspace
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenLastCalledWith("a");
  });

  it("backspace deletes whole ZWJ family emoji", async () => {
    const onChange = vi.fn();
    const family = "👨‍👩‍👧"; // length 8
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value={"x" + family}
        cursorPosition={[0, 1 + family.length]}
        onChange={onChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    onChange.mockClear();

    stdin.write("\x7F");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenLastCalledWith("x");
  });

  it("right arrow steps past whole emoji in one press", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value={"🚀x"}
        cursorPosition={[0, 0]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    onCursorChange.mockClear();

    stdin.write("\x1b[C"); // Right arrow
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Rocket = 2 code units; cursor jumps from 0 to 2
    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 2],
      expect.any(String),
      expect.any(Number),
    );
  });

  it("left arrow steps over whole emoji in one press", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        value={"🚀x"}
        cursorPosition={[0, 2]}
        onChange={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    onCursorChange.mockClear();

    stdin.write("\x1b[D"); // Left arrow
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalledWith(
      [0, 0],
      expect.any(String),
      expect.any(Number),
    );
  });
});

describe("TextArea > tab visual expansion", () => {
  // eslint-disable-next-line no-control-regex
  const ANSI_RE = /\x1b\[[0-9;]*m/g;
  const strip = (frame: string | undefined): string =>
    (frame ?? "").replace(ANSI_RE, "");

  it("renders tab as tabWidth spaces by default (4)", async () => {
    const { lastFrame } = render(
      <TextArea
        isActive={false}
        onSubmit={() => {}}
        value={"\thi"}
        cursorPosition={[0, 0]}
        onChange={() => {}}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    const frame = strip(lastFrame());
    expect(frame).toMatch(/    hi/);
  });

  it("honors tabWidth=2", async () => {
    const { lastFrame } = render(
      <TextArea
        isActive={false}
        onSubmit={() => {}}
        value={"\thi"}
        cursorPosition={[0, 0]}
        onChange={() => {}}
        tabWidth={2}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    const frame = strip(lastFrame());
    expect(frame).toMatch(/  hi/);
    expect(frame).not.toMatch(/    hi/);
  });

  it("renders → glyph + spaces when showInvisibles.tab is on", async () => {
    const { lastFrame } = render(
      <TextArea
        isActive={false}
        onSubmit={() => {}}
        value={"\thi"}
        cursorPosition={[0, 0]}
        onChange={() => {}}
        showInvisibles={{ tab: true }}
        tabWidth={4}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    const frame = strip(lastFrame());
    expect(frame).toMatch(/→   hi/);
  });
});
