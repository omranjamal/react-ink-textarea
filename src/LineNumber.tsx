import { Text } from "ink";
import type { ReactNode } from "react";

export type LineNumberProps = {
  readonly lineNumber: number;
  readonly totalLines: number;
  readonly isActive?: boolean;
  readonly color?: string;
  readonly activeColor?: string;
  readonly padChar?: string;
  readonly suffix?: string;
};

export const LineNumber = ({
  lineNumber,
  totalLines,
  isActive = false,
  color = "gray",
  activeColor = "cyan",
  padChar = " ",
  suffix = " ",
}: LineNumberProps): ReactNode => {
  const width = String(totalLines).length;
  const num = String(lineNumber + 1).padStart(width, padChar);

  return (
    <Text color={isActive ? activeColor : color} dimColor={!isActive}>
      {isActive ? num : ' '.padStart(width, padChar)}
      {suffix}
    </Text>
  );
};
