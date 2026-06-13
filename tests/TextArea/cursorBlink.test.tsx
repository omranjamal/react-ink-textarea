import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import { TextArea } from "../../src/index.js";

// The cursor is drawn with the reverse-video ANSI pair (\x1b[7m ... \x1b[27m).
// When the blink toggles "off", that pair is absent from the frame; when "on"
// (or steady) it is present. We sample frames across a span longer than
// `cursorInterval` and inspect for the reverse-video opener.
const REVERSE = "\x1b[7m";

const sampleFrames = async (
  lastFrame: () => string | undefined,
  samples: number,
  everyMs: number,
): Promise<string[]> => {
  const frames: string[] = [];
  for (let i = 0; i < samples; i++) {
    frames.push(lastFrame() ?? "");
    await new Promise((r) => setTimeout(r, everyMs));
  }
  return frames;
};

describe("cursor blink", () => {
  it("toggles the cursor off over time by default", async () => {
    const { lastFrame } = render(
      <TextArea focus={true} onSubmit={() => {}} cursorInterval={40} />,
    );

    // Across ~12 interval windows at least one frame should have the cursor
    // blinked off (no reverse-video pair present).
    const frames = await sampleFrames(lastFrame, 24, 20);
    const blinkedOff = frames.some((f) => !f.includes(REVERSE));

    expect(blinkedOff).toBe(true);
  });

  it("keeps the cursor steady when disableCursorBlink is set", async () => {
    const { lastFrame } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        cursorInterval={40}
        disableCursorBlink={true}
      />,
    );

    // Over the same span the cursor must never disappear: every sampled frame
    // keeps the reverse-video pair.
    const frames = await sampleFrames(lastFrame, 24, 20);
    const alwaysVisible = frames.every((f) => f.includes(REVERSE));

    expect(alwaysVisible).toBe(true);
  });

  it("keeps the cursor steady while typing when disabled", async () => {
    const { stdin, lastFrame } = render(
      <TextArea
        focus={true}
        onSubmit={() => {}}
        cursorInterval={40}
        typingPause={40}
        disableCursorBlink={true}
      />,
    );

    stdin.write("hi");
    const frames = await sampleFrames(lastFrame, 24, 20);

    // resetBlink is a no-op when disabled, so no typingPause timeout schedules
    // a blink — the cursor stays solid throughout.
    expect(frames.every((f) => f.includes(REVERSE))).toBe(true);
  });
});
