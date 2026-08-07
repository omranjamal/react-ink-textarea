import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";
import type { TLineSuffixProps } from "../../src/index.js";
import { Text } from "ink";

describe("TextArea lineSuffix", () => {
  it("renders a static suffix node after the line content", async () => {
    const { stdin, lastFrame } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        lineSuffix={<Text>{" [end]"}</Text>}
      />,
    );

    stdin.write("hello");
    await new Promise((resolve) => setTimeout(resolve, 100));

    const frame = lastFrame()!;
    expect(frame).toContain("hello");
    expect(frame).toContain("[end]");
    // Suffix sits to the right of the content on the same row.
    const line = frame
      .split("\n")
      .find((l) => l.includes("hello") && l.includes("[end]"))!;
    expect(line.indexOf("hello")).toBeLessThan(line.indexOf("[end]"));
  });

  it("renders a function-form suffix and passes it a props object", async () => {
    const lineSuffix = vi.fn((_props: TLineSuffixProps) => <Text>{" •"}</Text>);
    const { stdin } = render(
      <TextArea focus={true} onSubmit={() => {}} lineSuffix={lineSuffix} />,
    );

    stdin.write("hi");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(lineSuffix).toHaveBeenCalled();
    const lastCall = lineSuffix.mock.calls[lineSuffix.mock.calls.length - 1];
    expect(lastCall).toHaveLength(1);
    const props = lastCall![0];
    expect(typeof props.lineNumber).toBe("number");
    expect(typeof props.totalLines).toBe("number");
    expect(typeof props.isActiveLine).toBe("boolean");
    expect(typeof props.isVirtualLine).toBe("boolean");
    expect(typeof props.isContinuationLine).toBe("boolean");
    expect(typeof props.continuationIndex).toBe("number");
    expect(typeof props.isLastChunkOfLine).toBe("boolean");
  });

  it("renders prefix and suffix together on the same row", async () => {
    const { stdin, lastFrame } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        linePrefix={<Text>{"| "}</Text>}
        lineSuffix={<Text>{" |"}</Text>}
      />,
    );

    stdin.write("mid");
    await new Promise((resolve) => setTimeout(resolve, 100));

    const line = lastFrame()!
      .split("\n")
      .find((l) => l.includes("mid"))!;
    expect(line.indexOf("|")).toBeLessThan(line.indexOf("mid"));
    expect(line.lastIndexOf("|")).toBeGreaterThan(line.indexOf("mid"));
  });

  it("marks the last visual row of a wrapped line with isLastChunkOfLine", async () => {
    const seen: TLineSuffixProps[] = [];
    const { stdin } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        lineSuffix={(props) => {
          seen.push(props);
          return props.isLastChunkOfLine ? <Text>{" #"}</Text> : null;
        }}
      />,
    );

    // Long single logical line so it wraps into multiple visual rows.
    stdin.write("x".repeat(400));
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Rows for logical line 0 should include continuation rows (not last)
    // and exactly the final chunk flagged isLastChunkOfLine.
    const line0 = seen.filter((p) => p.lineNumber === 0 && !p.isVirtualLine);
    expect(line0.some((p) => p.isContinuationLine)).toBe(true);
    expect(line0.some((p) => p.isLastChunkOfLine)).toBe(true);
    // A continuation row that is not the last chunk must not be last.
    expect(
      line0.some((p) => p.isContinuationLine && !p.isLastChunkOfLine),
    ).toBe(true);
  });
});
