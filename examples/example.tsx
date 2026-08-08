import { render, Box, Text, useInput } from "ink";
import {
  useState,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
  type Ref,
} from "react";
import {
  TextArea,
  LineNumberPrefix,
  type TLabels,
  type TextAreaProps,
  type TextAreaHandle,
} from "react-ink-textarea";

const SLASH_COMMANDS = [
  "/train",
  "/track",
  "/transfer",
  "/transact",
  "/help",
  "/quit",
];

const PLACEHOLDER = `
It obviously supports multi-line
placeholders.

With highlighting too like: /help
or: @john
`.trim();

const subsequenceMatches = (query: string, target: string): boolean => {
  if (query === "") return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let i = 0;
  for (let j = 0; j < t.length && i < q.length; j++) {
    if (t[j] === q[i]) i++;
  }
  return i === q.length;
};

const getSlashWordAtCursor = (
  value: string,
  line: number,
  col: number,
): { word: string; lineIdx: number; start: number; end: number } | null => {
  const lines = value.split("\n");
  const lineText = lines[line] ?? "";
  let start = col;
  while (start > 0 && /[a-zA-Z]/.test(lineText[start - 1]!)) start--;
  if (start === 0 || lineText[start - 1] !== "/") return null;
  start -= 1;
  let end = col;
  while (end < lineText.length && /[a-zA-Z]/.test(lineText[end]!)) end++;
  return { word: lineText.slice(start, end), lineIdx: line, start, end };
};

const MARGIN_MIN = 2;
const MARGIN_MAX = 20;
const MARGIN_STEP = 2;
const MARGIN_DEFAULT = 12;

type DemoBoxProps = {
  readonly title: string;
  readonly active: boolean;
  readonly hideStatusline?: boolean;
  readonly textAreaProps: Omit<TextAreaProps, "focus" | "onDimensions">;
  readonly ref?: Ref<TextAreaHandle>;
  readonly marginLeft: number;
  readonly onMarginShift: (delta: number) => void;
};

const DemoBox = ({
  title,
  active,
  hideStatusline,
  textAreaProps,
  ref,
  marginLeft,
  onMarginShift,
}: DemoBoxProps): ReactNode => {
  const [charCount, setCharCount] = useState(0);
  const [cursorPos, setCursorPos] = useState<[number, number]>([0, 0]);
  const [lineWidth, setLineWidth] = useState(0);
  const [chunkType, setChunkType] = useState<string>("text");
  const [chunkIdx, setChunkIdx] = useState<number>(0);
  const [boundary, setBoundary] = useState<string | null>(null);
  const boundaryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashBoundary = (arrow: string) => {
    setBoundary(arrow);
    if (boundaryTimer.current) clearTimeout(boundaryTimer.current);
    boundaryTimer.current = setTimeout(() => setBoundary(null), 500);
  };

  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        width={64}
        borderStyle="single"
        paddingY={1}
        paddingX={3}
        marginLeft={marginLeft}
        borderDimColor
        borderColor={active ? "cyan" : "gray"}
      >
        <Box flexDirection="row" gap={2} marginBottom={1}>
          <Text bold dimColor>
            {title} {active ? "(focused)" : "(Tab to focus)"}
          </Text>
        </Box>
        <TextArea
          ref={ref}
          {...textAreaProps}
          focus={active}
          onChange={(value) => {
            setCharCount(value.length);
            textAreaProps.onChange?.(value);
          }}
          onCursorChange={(pos, type, idx) => {
            setCursorPos(pos);
            setChunkType(type);
            setChunkIdx(idx);
            textAreaProps.onCursorChange?.(pos, type, idx);
          }}
          onDimensions={setLineWidth}
          onFirstLineUp={() => {
            flashBoundary("↑");
            textAreaProps.onFirstLineUp?.();
          }}
          onLastLineDown={() => {
            flashBoundary("↓");
            textAreaProps.onLastLineDown?.();
          }}
          onFirstCharacterLeft={() => {
            flashBoundary("←");
            onMarginShift(-MARGIN_STEP);
            textAreaProps.onFirstCharacterLeft?.();
          }}
          onLastCharacterRight={() => {
            flashBoundary("→");
            onMarginShift(MARGIN_STEP);
            textAreaProps.onLastCharacterRight?.();
          }}
        />
      </Box>
      {hideStatusline ? null : (
        <Box paddingX={2} marginLeft={marginLeft} flexDirection="row" gap={2} height={1}>
          {active ? (
            <Text>
              {charCount} chars | Line {cursorPos[0] + 1}, Col {cursorPos[1] + 1}{" "}
              | CURRENT={chunkType} ({chunkIdx}) | W={lineWidth}
              {boundary ? (
                <Text color="cyan" bold>
                  {" | "}
                  {boundary}
                </Text>
              ) : null}
            </Text>
          ) : null}
        </Box>
      )}
    </Box>
  );
};

const HISTORY = [
  "detect up arrow from first line",
  "",
  "or detect down arrow on last line",
];

const App = () => {
  const [, setSubmitted] = useState("");
  const [activeBox, setActiveBox] = useState<0 | 1>(0);
  const [, setHistoryIdx] = useState<number>(1);
  const [box1Value, setBox1Value] = useState<string>(HISTORY[1]!);
  const [box1Cursor, setBox1Cursor] = useState<[number, number]>([0, 0]);
  const [pickerSelection, setPickerSelection] = useState(0);
  const [box1Margin, setBox1Margin] = useState(MARGIN_DEFAULT);
  const [box2Margin, setBox2Margin] = useState(MARGIN_DEFAULT);
  const box1Ref = useRef<TextAreaHandle>(null);

  // Typing "<vary>" animates the active line's prefix width: an arrow whose
  // dash shaft grows/shrinks by 5 each tick. Because wrapping re-measures per
  // line, the caret's line re-wraps live as its prefix width changes.
  const [varyDashes, setVaryDashes] = useState(0);
  const varyDirRef = useRef<1 | -1>(1);
  const varyActive = box1Value.includes("<vary>");
  useEffect(() => {
    if (!varyActive) {
      setVaryDashes(0);
      return;
    }
    const id = setInterval(() => {
      setVaryDashes((n) => {
        let next = n + varyDirRef.current; // one dash at a time
        if (next >= 20) {
          next = 20;
          varyDirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          varyDirRef.current = 1;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [varyActive]);

  const shiftMargin = (
    setter: (updater: (prev: number) => number) => void,
    delta: number,
  ) => {
    setter((m) => Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, m + delta)));
  };

  const slashCtx = useMemo(
    () => getSlashWordAtCursor(box1Value, box1Cursor[0], box1Cursor[1]),
    [box1Value, box1Cursor],
  );

  const slashQuery = slashCtx ? slashCtx.word.slice(1) : "";
  const slashMatches = useMemo(() => {
    if (!slashCtx) return [] as string[];
    return SLASH_COMMANDS.filter((cmd) =>
      subsequenceMatches(slashQuery, cmd.slice(1)),
    );
  }, [slashCtx, slashQuery]);

  const pickerOpen =
    activeBox === 0 && slashCtx !== null && slashMatches.length > 0;
  const visiblePickerItems = slashMatches.slice(0, 3);
  const hiddenCount = slashMatches.length - visiblePickerItems.length;

  useEffect(() => {
    setPickerSelection(0);
  }, [slashQuery, slashMatches.length]);

  const insertSelected = () => {
    const cmd = visiblePickerItems[pickerSelection];
    if (!cmd || !slashCtx) return;
    const remaining = cmd.slice(slashCtx.word.length) + " ";
    box1Ref.current?.insert(remaining);
  };

  // Esc instantly toggles a fixed-width marker on the caret's sub-row.
  const [escPrefix, setEscPrefix] = useState(false);
  useInput((_input, key) => {
    if (key.escape) setEscPrefix((v) => !v);
  });

  useInput((_input, key) => {
    if (!pickerOpen) return;
    if (key.upArrow) {
      setPickerSelection((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setPickerSelection((i) =>
        Math.min(visiblePickerItems.length - 1, i + 1),
      );
    } else if (key.return) {
      insertSelected();
    }
  });

  // Live copy of history so the current edit isn't lost when navigating: the
  // draft is saved back into its slot before moving, and restored on return.
  const historySlotsRef = useRef<string[]>([...HISTORY]);
  const navigateHistory = (delta: -1 | 1) => {
    setHistoryIdx((idx) => {
      historySlotsRef.current[idx] = box1Value; // save current edit
      const next = Math.max(
        0,
        Math.min(historySlotsRef.current.length - 1, idx + delta),
      );
      setBox1Value(historySlotsRef.current[next] ?? "");
      return next;
    });
  };

  const labels = useMemo<TLabels>(
    () => [
      {
        pattern: /\/[a-zA-Z]*/g,
        label: (m) => {
          const text = m[0];
          const q = text.slice(1);
          if (q === "") return "slashCommand";
          const has = SLASH_COMMANDS.some((c) =>
            subsequenceMatches(q, c.slice(1)),
          );
          return has ? "slashCommand" : undefined;
        },
      },
      { pattern: /@[a-zA-Z]{3,}/g, label: "mention" },
    ],
    [],
  );
  const styles = useMemo(
    () => ({
      slashCommand: { color: "#ff8800" },
      mention: { color: "blue", bold: true },
    }),
    [],
  );

  const box1Keybindings = pickerOpen
    ? { Up: false, Down: false, Enter: false }
    : undefined;

  return (
    <Box flexDirection="column" gap={1} paddingY={1} paddingX={6}>
      <DemoBox
        title="DEMO 1"
        active={activeBox === 0}
        hideStatusline={pickerOpen}
        ref={box1Ref}
        marginLeft={box1Margin}
        onMarginShift={(d) => shiftMargin(setBox1Margin, d)}
        textAreaProps={{
          onSubmit: setSubmitted,
          placeholder: PLACEHOLDER,
          autoNewLineLimit: 0,
          viewportLines: 10,
          initialLineCount: 5,
          showInvisibles: true,
          onTab: pickerOpen ? () => insertSelected() : () => setActiveBox(1),
          value: box1Value,
          onChange: setBox1Value,
          onCursorChange: (pos) => setBox1Cursor(pos),
          onFirstLineUp: () => navigateHistory(-1),
          onLastLineDown: () => navigateHistory(1),
          labels,
          styles,
          linePrefix: (props) => {
            // Anchor markers to the caret's logical line, FIRST sub-row
            // (continuationIndex 0) — never the active sub-row. A
            // width-changing decoration on the active sub-row is circular (its
            // width moves the caret across a wrap boundary, which moves the
            // decoration), leaving a dead zone that can't reflow. Anchoring to
            // a fixed sub-row breaks the loop: only sub-row 0 is squeezed and
            // the rest reflow cleanly, regardless of where the caret sits.
            const onCaretLineHead =
              !props.isVirtualLine &&
              props.continuationIndex === 0 &&
              props.lineNumber === box1Cursor[0];
            return (
              <Box flexDirection="row">
                <LineNumberPrefix {...props} />
                {onCaretLineHead && escPrefix ? (
                  <Text color="cyan">{"===============>>"}</Text>
                ) : null}
                {onCaretLineHead && varyActive ? (
                  <Text color="yellow">{"-".repeat(varyDashes) + ">"}</Text>
                ) : null}
              </Box>
            );
          },
          lineSuffix: ({ lineNumber, isLastChunkOfLine }) => {
            if (!isLastChunkOfLine) return null; // once per logical line
            const t = box1Value.split("\n")[lineNumber] ?? "";
            if (/tomato/i.test(t)) return <Text> 🍅</Text>;
            if (/potato/i.test(t)) return <Text> 🥔</Text>;
            return null;
          },
          keybindings: box1Keybindings,
        }}
      />

      {pickerOpen ? (
        <Box paddingLeft={8} paddingRight={2} marginLeft={box1Margin} marginTop={-1} flexDirection="column">
          {visiblePickerItems.map((cmd, i) => (
            <Text key={cmd}>
              <Text color={i === pickerSelection ? "cyan" : undefined}>
                {i === pickerSelection ? "▸ " : "  "}
              </Text>
              <Text color="#ff8800" bold={i === pickerSelection}>
                {cmd}
              </Text>
            </Text>
          ))}
          {hiddenCount > 0 ? (
            <Text dimColor>{`  … ${hiddenCount} more`}</Text>
          ) : null}
          <Text dimColor>{"  ↑/↓ select • Enter/Tab insert"}</Text>
        </Box>
      ) : (
        <DemoBox
          title="DEMO 2"
          active={activeBox === 1}
          marginLeft={box2Margin}
          onMarginShift={(d) => shiftMargin(setBox2Margin, d)}
          textAreaProps={{
            onSubmit: setSubmitted,
            value:
              "This textarea is read-only.\nYou can navigate, submit, or press Tab,\nbut editing and paste are blocked.",
            readOnly: true,
            autoNewLineLimit: 3,
            viewportLines: 5,
            initialLineCount: 3,
            onTab: () => setActiveBox(0),
            disableCursorBlink: true,
            labels,
            styles,
            linePrefix: ({ isActiveLine, readOnly }) => (
              <Text color={isActiveLine ? "cyan" : "gray"} dimColor={readOnly}>
                │{" "}
              </Text>
            ),
          }}
        />
      )}
    </Box>
  );
};

render(<App />);
