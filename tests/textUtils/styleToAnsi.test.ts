import { describe, it, expect } from "vitest";
import { styleToAnsi } from "../../src/textUtils.js";

describe("styleToAnsi", () => {
  it("returns empty pair for empty style", () => {
    expect(styleToAnsi({})).toEqual({ open: "", close: "", unsupported: false });
  });

  it("emits bold SGR pair", () => {
    expect(styleToAnsi({ bold: true })).toEqual({
      open: "\x1b[1m",
      close: "\x1b[22m",
      unsupported: false,
    });
  });

  it("emits dim SGR pair (shares 22m close with bold)", () => {
    expect(styleToAnsi({ dim: true })).toEqual({
      open: "\x1b[2m",
      close: "\x1b[22m",
      unsupported: false,
    });
  });

  it("emits italic / underline / strikethrough / inverse pairs", () => {
    expect(styleToAnsi({ italic: true })).toEqual({
      open: "\x1b[3m",
      close: "\x1b[23m",
      unsupported: false,
    });
    expect(styleToAnsi({ underline: true })).toEqual({
      open: "\x1b[4m",
      close: "\x1b[24m",
      unsupported: false,
    });
    expect(styleToAnsi({ strikethrough: true })).toEqual({
      open: "\x1b[9m",
      close: "\x1b[29m",
      unsupported: false,
    });
    expect(styleToAnsi({ inverse: true })).toEqual({
      open: "\x1b[7m",
      close: "\x1b[27m",
      unsupported: false,
    });
  });

  it("emits named color pair", () => {
    expect(styleToAnsi({ color: "red" })).toEqual({
      open: "\x1b[31m",
      close: "\x1b[39m",
      unsupported: false,
    });
  });

  it("emits named bgColor pair", () => {
    expect(styleToAnsi({ bgColor: "red" })).toEqual({
      open: "\x1b[41m",
      close: "\x1b[49m",
      unsupported: false,
    });
  });

  it("emits hex color via ansi256", () => {
    const result = styleToAnsi({ color: "#ff8800" });
    expect(result.unsupported).toBe(false);
    expect(result.open.startsWith("\x1b[38;5;")).toBe(true);
    expect(result.close).toBe("\x1b[39m");
  });

  it("emits hex bgColor via ansi256", () => {
    const result = styleToAnsi({ bgColor: "#00ff00" });
    expect(result.unsupported).toBe(false);
    expect(result.open.startsWith("\x1b[48;5;")).toBe(true);
    expect(result.close).toBe("\x1b[49m");
  });

  it("composes multiple fields with closes in reverse order", () => {
    const result = styleToAnsi({ bold: true, color: "red" });
    expect(result.open).toBe("\x1b[1m\x1b[31m");
    expect(result.close).toBe("\x1b[39m\x1b[22m");
    expect(result.unsupported).toBe(false);
  });

  it("marks unsupported for unrecognized color", () => {
    const result = styleToAnsi({ color: "definitelyNotAColor" });
    expect(result.unsupported).toBe(true);
  });

  it("marks unsupported for unrecognized bgColor", () => {
    const result = styleToAnsi({ bgColor: "neonpurple" });
    expect(result.unsupported).toBe(true);
  });
});
