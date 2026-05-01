import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import { LineNumber } from "../../src/index.js";

describe("LineNumber", () => {
  it("renders LineNumber component", () => {
    const { lastFrame } = render(
      <LineNumber lineNumber={0} totalLines={10} isActive={false} />,
    );
    expect(lastFrame()).toContain(" 1");
  });

  it("renders active LineNumber with active color", () => {
    const { lastFrame } = render(
      <LineNumber
        lineNumber={0}
        totalLines={10}
        isActive={true}
        activeColor="red"
      />,
    );
    expect(lastFrame()).toContain(" 1");
  });

  it("renders number when inactive", () => {
    const { lastFrame } = render(
      <LineNumber lineNumber={0} totalLines={10} isActive={false} />,
    );
    expect(lastFrame()).toContain("1");
  });

  it("renders number when active", () => {
    const { lastFrame } = render(
      <LineNumber lineNumber={4} totalLines={10} isActive={true} />,
    );
    expect(lastFrame()).toContain("5");
  });

  it("pads number to match totalLines digit width", () => {
    const { lastFrame } = render(
      <LineNumber lineNumber={0} totalLines={100} isActive={false} />,
    );
    expect(lastFrame()).toContain("  1");
  });
});
