import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { useRef, useEffect } from "react";
import { TextArea, type TextAreaHandle } from "../../src/index.js";

describe("TextArea > ref.insert", () => {
  it("exposes an imperative handle that inserts text at the cursor", async () => {
    const TestApp = ({ insertText }: { insertText: string }) => {
      const ref = useRef<TextAreaHandle>(null);
      useEffect(() => {
        ref.current?.insert(insertText);
      }, [insertText]);
      return <TextArea ref={ref} focus={true} onSubmit={() => {}} />;
    };

    const { lastFrame } = render(<TestApp insertText="hello" />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // eslint-disable-next-line no-control-regex
    const stripped = (lastFrame() ?? "").replace(/\x1b\[[0-9;]*m/g, "");
    expect(stripped).toContain("hello");
  });

  it("inserts at the controlled cursor position", async () => {
    const onChange = vi.fn();
    const TestApp = () => {
      const ref = useRef<TextAreaHandle>(null);
      useEffect(() => {
        ref.current?.insert("INSERTED");
      }, []);
      return (
        <TextArea
          ref={ref}
          focus={true}
          onSubmit={() => {}}
          value="prefix-suffix"
          cursorPosition={[0, 7]}
          onChange={onChange}
        />
      );
    };

    render(<TestApp />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).toHaveBeenCalledWith("prefix-INSERTEDsuffix");
  });

  it("inserting an empty string is a no-op", async () => {
    const onChange = vi.fn();
    const TestApp = () => {
      const ref = useRef<TextAreaHandle>(null);
      useEffect(() => {
        ref.current?.insert("");
      }, []);
      return (
        <TextArea
          ref={ref}
          focus={true}
          onSubmit={() => {}}
          value="hello"
          cursorPosition={[0, 5]}
          onChange={onChange}
        />
      );
    };

    render(<TestApp />);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChange).not.toHaveBeenCalled();
  });
});
