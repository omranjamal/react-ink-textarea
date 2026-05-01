import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";

describe("TextArea > Submit edge cases", () => {
  it("Enter with empty text calls onSubmit with empty string", async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <TextArea isActive={true} onSubmit={onSubmit} />,
    );

    stdin.write("\r");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onSubmit).toHaveBeenCalledWith("");
  });

  it("Enter with multiline text passes full value including newlines", async () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <TextArea isActive={true} onSubmit={onSubmit} />,
    );

    stdin.write("line1");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x0A");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("line2");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\r");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onSubmit).toHaveBeenCalledWith("line1\nline2");
  });
});

describe("TextArea > autoNewLineLimit edge cases", () => {
  it("autoNewLineLimit=0 never creates trailing empty lines via down arrow", async () => {
    const onLastLineDown = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        autoNewLineLimit={0}
        onLastLineDown={onLastLineDown}
      />,
    );

    stdin.write("\x1b[B");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onLastLineDown).toHaveBeenCalled();
  });

  it("autoNewLineLimit=1 allows exactly one trailing empty line", async () => {
    const onLastLineDown = vi.fn();
    const { stdin } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        autoNewLineLimit={1}
        onLastLineDown={onLastLineDown}
        initialLineCount={1}
      />,
    );

    stdin.write("text");
    await new Promise((resolve) => setTimeout(resolve, 50));

    stdin.write("\x1b[B");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onLastLineDown).not.toHaveBeenCalled();

    stdin.write("\x1b[B");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onLastLineDown).toHaveBeenCalled();
  });
});
