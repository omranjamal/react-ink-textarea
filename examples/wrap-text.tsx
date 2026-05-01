import { Box, Text } from "ink";
import { TextArea, LineNumber } from "ink-textarea";
import React, { useState } from "react";

export default function WrapExample() {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Text Wrapping Example</Text>
      <Text dimColor>
        Type long text - it will automatically wrap to the next line
      </Text>
      <Box marginY={1}>
        <TextArea
          isActive={true}
          onSubmit={(val) => setSubmitted(val)}
          value={value}
          onChange={setValue}
          placeholder="Type a long sentence here and watch it wrap..."
          linePrefix={(props) => (
            <LineNumber
              lineNumber={props.lineNumber}
              totalLines={props.totalLines}
              isActive={props.isActiveLine}
              activeColor="cyan"
            />
          )}
          wrapText={true}
          initialLineCount={3}
        />
      </Box>
      {submitted && (
        <Box marginTop={1}>
          <Text color="green">Submitted: {submitted}</Text>
        </Box>
      )}
      <Box marginTop={2}>
        <Text dimColor>
          Press Enter to submit. Long lines will wrap automatically.
        </Text>
      </Box>
    </Box>
  );
}

// Run with: npx tsx examples/wrap-text.tsx
