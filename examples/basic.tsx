import { render, Box, Text } from "ink";
import { useState } from "react";
import React from "react";
import { TextArea } from "ink-textarea";

const App = () => {
  const [submitted, setSubmitted] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (value: string) => {
    setSubmitted(value);
    setIsActive(false);
  };

  return (
    <Box flexDirection="column" gap={1} padding={2}>
      <Text bold>Basic TextArea Example</Text>
      <Text dimColor>Ctrl+J for new line, Enter to submit</Text>

      <TextArea
        isActive={isActive}
        onSubmit={handleSubmit}
        placeholder="Type your message here..."
      />

      {submitted && (
        <Box flexDirection="column">
          <Text color="green">Submitted:</Text>
          <Text>{submitted}</Text>
        </Box>
      )}
    </Box>
  );
};

render(<App />);
