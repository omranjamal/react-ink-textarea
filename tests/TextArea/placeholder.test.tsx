import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";

describe("TextArea > Placeholder multiline", () => {
  it("renders each line of a multiline placeholder", () => {
    const { lastFrame } = render(
      <TextArea
        isActive={false}
        onSubmit={() => {}}
        placeholder={"line one\nline two"}
        initialLineCount={2}
      />,
    );

    const frame = lastFrame()!;
    expect(frame).toContain("line one");
    expect(frame).toContain("line two");
  });

  it("placeholder disappears when text is typed", async () => {
    const { stdin, lastFrame } = render(
      <TextArea
        isActive={true}
        onSubmit={() => {}}
        placeholder="Type here..."
      />,
    );

    stdin.write("x");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).not.toContain("Type here...");
  });
});
