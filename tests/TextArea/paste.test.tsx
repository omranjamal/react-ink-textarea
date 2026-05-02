import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";

const PASTE_START = "\x1b[200~";
const PASTE_END = "\x1b[201~";

describe("TextArea > Multi-line paste", () => {
  it("inserts pasted multi-line text with \\n separators", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} />,
    );

    stdin.write(`${PASTE_START}line1\nline2\nline3${PASTE_END}`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const frame = lastFrame()!;
    expect(frame).toContain("line1");
    expect(frame).toContain("line2");
    expect(frame).toContain("line3");
  });

  it("normalizes \\r\\n (CRLF) line endings on paste", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} />,
    );

    stdin.write(`${PASTE_START}line1\r\nline2\r\nline3${PASTE_END}`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const frame = lastFrame()!;
    expect(frame).toContain("line1");
    expect(frame).toContain("line2");
    expect(frame).toContain("line3");
    expect(frame).not.toContain("\r");
  });

  it("normalizes bare \\r (CR) line endings on paste", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} />,
    );

    stdin.write(`${PASTE_START}line1\rline2\rline3${PASTE_END}`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const frame = lastFrame()!;
    expect(frame).toContain("line1");
    expect(frame).toContain("line2");
    expect(frame).toContain("line3");
    expect(frame).not.toContain("\r");
  });

  it("places cursor at end of pasted block", async () => {
    const onCursorChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onCursorChange={onCursorChange}
      />,
    );

    stdin.write(`${PASTE_START}a\nbb\nccc${PASTE_END}`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onCursorChange).toHaveBeenCalled();
    const lastCall =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1]![0];
    expect(lastCall).toEqual([2, 3]);
  });

  it("undoes a multi-line paste in a single step", async () => {
    const onChange = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onChange={onChange}
      />,
    );

    stdin.write(`${PASTE_START}line1\nline2\nline3${PASTE_END}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onChange).toHaveBeenLastCalledWith("line1\nline2\nline3");

    stdin.write("\x1A"); // Ctrl+Z
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenLastCalledWith("");
  });
});
