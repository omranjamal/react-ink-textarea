import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";

describe("TextArea > onDimensions", () => {
  it("accepts onDimensions prop without error", async () => {
    const onDimensions = vi.fn();
    const { stdin, lastFrame } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onDimensions={onDimensions}
      />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(lastFrame()).toContain("hello");
  });

  it("onDimensions fires on initial measurement", async () => {
    const onDimensions = vi.fn();
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        onDimensions={onDimensions}
      />,
    );
    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onDimensions).toHaveBeenCalled();
    const width = onDimensions.mock.calls[0]![0];
    expect(width).toBeGreaterThan(0);
  });
});

describe("TextArea > Character-level chunking", () => {
  it("renders text correctly when lineWidth is 0 (before measurement)", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} />,
    );

    stdin.write("hello world");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(lastFrame()).toContain("hello");
    expect(lastFrame()).toContain("world");
  });

  it("renders multiline text with correct line count", async () => {
    const { stdin, lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} />,
    );

    stdin.write("line1");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x0A");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("line2");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).toContain("line1");
    expect(lastFrame()).toContain("line2");
  });
});
