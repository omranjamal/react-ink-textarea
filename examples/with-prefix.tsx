import { render, Box, Text } from "ink";
import { useState } from "react";
import React from "react";
import { TextArea, LineNumber } from "ink-textarea";

const App = () => {
  const [submitted, setSubmitted] = useState("");

  return (
    <Box flexDirection="column" gap={1} padding={2}>
      <Text bold>TextArea with Line Prefix</Text>
      <Text dimColor>This example shows line numbers and a border</Text>

      <TextArea
        isActive={true}
        onSubmit={setSubmitted}
        placeholder="Write some code..."
        maxTrailingEmptyLines={3}
        cursorStyle={"block"}
        linePrefix={(lineNumber, totalLines, isActiveLine) => (
          <Text>
            <Text color="gray">│ </Text>
            <LineNumber
              lineNumber={lineNumber}
              totalLines={totalLines}
              isActive={isActiveLine}
            />
            <Text color="gray"> │ </Text>
          </Text>
        )}
      />

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
