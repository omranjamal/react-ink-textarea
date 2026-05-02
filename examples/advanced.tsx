import { render, Box, Text } from "ink";
import { useState, useMemo } from "react";
import { TextArea, LineNumberPrefix, type TLabels } from "ink-textarea";

const SLASH_COMMANDS = new Set(["/train", "/help", "/quit"]);

const App = () => {
  const [submitted, setSubmitted] = useState("");
  const [boundaryMessage, setBoundaryMessage] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [cursorPos, setCursorPos] = useState<[number, number]>([0, 0]);
  const [lineWidth, setLineWidth] = useState(0);
  const [chunkType, setChunkType] = useState<string>("text");
  const [chunkIdx, setChunkIdx] = useState<number>(0);

  const labels = useMemo<TLabels>(
    () => [
      {
        pattern: /\/[a-zA-Z]+/g,
        label: (m) => (SLASH_COMMANDS.has(m[0]) ? "slashCommand" : undefined),
      },
    ],
    [],
  );
  const styles = useMemo(
    () => ({ slashCommand: { color: "#ff8800" } }),
    [],
  );

  const showBoundaryMessage = (message: string) => {
    setBoundaryMessage(message);
    setTimeout(() => {
      setBoundaryMessage(null);
    }, 500);
  };

  return (
    <Box flexDirection="column" gap={1} padding={2} width={64}>
      <Text bold>TextArea with Line Prefix</Text>
      <Text dimColor>
        This example shows line numbers and a border. Try pressing ↑ on first
        line, ↓ on last line, ← at start, or → at end!
      </Text>

      <TextArea
        focus={true}
        onSubmit={setSubmitted}
        placeholder={`Write some code...
Use arrow keys to navigate

/train to train

Ctrl+Enter for new line`}
        autoNewLineLimit={4}
        initialLineCount={4}
        showInvisibles={true}
        onFirstLineUp={() => showBoundaryMessage("[first line up]")}
        onLastLineDown={() => showBoundaryMessage("[last line down]")}
        onFirstCharacterLeft={() =>
          showBoundaryMessage("[first character left]")
        }
        onLastCharacterRight={() =>
          showBoundaryMessage("[last character right]")
        }
        onChange={(value) => setCharCount(value.length)}
        onCursorChange={(pos, type, idx) => {
          setCursorPos(pos);
          setChunkType(type);
          setChunkIdx(idx);
        }}
        onDimensions={setLineWidth}
        labels={labels}
        styles={styles}
        linePrefix={LineNumberPrefix}
      />

      <Text dimColor>
        {charCount} characters | Line {cursorPos[0] + 1}, Col {cursorPos[1] + 1} | Type {chunkType} | Chunk {chunkIdx} | Width {lineWidth}
      </Text>

      {boundaryMessage && (
        <Text color="cyan" bold>
          {boundaryMessage}
        </Text>
      )}

      {submitted && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="green">You wrote:</Text>
          {submitted.split("\n").map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

render(<App />);
