import { Text } from "ink";
import type { ReactNode } from "react";
import type { TLinePrefixProps } from "./types.js";

export type LineNumberPrefixProps = TLinePrefixProps & {
  readonly color?: string;
  readonly activeColor?: string;
  readonly numberColor?: string;
  readonly border?: string;
};

export const LineNumberPrefix = ({
  lineNumber,
  totalLines,
  isActiveLine,
  isVirtualLine,
  isContinuationLine,
  color = "gray",
  activeColor = "magenta",
  numberColor = "white",
  border = "│",
}: LineNumberPrefixProps): ReactNode => {
  const width = String(totalLines).length;
  const numText = isContinuationLine
    ? border.padStart(width, " ")
    : String(lineNumber + 1).padStart(width, " ");

  const sideColor = isActiveLine ? activeColor : color;
  const middleColor =
    isVirtualLine || isContinuationLine
      ? color
      : isActiveLine
        ? activeColor
        : numberColor;

  return (
    <Text>
      <Text color={sideColor}>{border} </Text>
      <Text color={middleColor}>{numText}</Text>
      <Text color={sideColor}> {border} </Text>
    </Text>
  );
};
