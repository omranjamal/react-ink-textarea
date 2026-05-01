import { render, Box, Text } from "ink";
import { useState } from "react";
import React from "react";
import { TextArea } from "ink-textarea";

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
        linePrefix={(lineNumber, totalLines) => {
          const width = String(totalLines).length;
          const num = String(lineNumber + 1).padStart(width, " ");
          return (
            <Text>
              <Text color="gray">│ </Text>
              <Text dimColor>{num}</Text>
              <Text color="gray"> │ </Text>
            </Text>
          );
        }}
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
