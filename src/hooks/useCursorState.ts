import { useState, useEffect, useRef } from "react";
import {
  getCursorLineAndColumn,
  getCursorFromLineColumn,
} from "../textUtils.js";

type UseCursorStateOptions = {
  controlledValue: string | undefined;
  controlledPosition: [number, number] | undefined;
  onChange: ((value: string) => void) | undefined;
  onCursorChange: ((position: [number, number]) => void) | undefined;
};

type UseCursorStateReturn = {
  value: string;
  cursor: number;
  setValue: (updater: string | ((prev: string) => string)) => void;
  setCursor: (
    updater: number | ((prev: number) => number),
    valueForCalculation?: string,
  ) => void;
};

export const useCursorState = ({
  controlledValue,
  controlledPosition,
  onChange,
  onCursorChange,
}: UseCursorStateOptions): UseCursorStateReturn => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const [internalCursor, setInternalCursor] = useState(0);

  const valueRef = useRef(isControlled ? controlledValue : internalValue);
  const value = isControlled ? controlledValue : internalValue;

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const lastReportedPosition = useRef<[number, number] | null>(null);

  const processExternalPosition = (): {
    cursor: number;
    clampedLine: number;
    clampedCol: number;
    wasClamped: boolean;
  } => {
    if (controlledPosition === undefined) {
      const { line, column } = getCursorLineAndColumn(value, internalCursor);
      return {
        cursor: internalCursor,
        clampedLine: line,
        clampedCol: column,
        wasClamped: false,
      };
    }
    const [line, col] = controlledPosition;
    const { cursor, clampedLine, clampedCol } = getCursorFromLineColumn(
      value,
      line,
      col,
    );
    const wasClamped = line !== clampedLine || col !== clampedCol;
    return { cursor, clampedLine, clampedCol, wasClamped };
  };

  const { cursor, clampedLine, clampedCol, wasClamped } =
    processExternalPosition();

  useEffect(() => {
    if (wasClamped && onCursorChange) {
      const newPosition: [number, number] = [clampedLine, clampedCol];
      if (
        lastReportedPosition.current === null ||
        lastReportedPosition.current[0] !== newPosition[0] ||
        lastReportedPosition.current[1] !== newPosition[1]
      ) {
        lastReportedPosition.current = newPosition;
        onCursorChange(newPosition);
      }
    }
  }, [wasClamped, clampedLine, clampedCol, onCursorChange]);

  // Call onChange with initial value on first render in uncontrolled mode
  useEffect(() => {
    if (!isControlled && onChange) {
      onChange(internalValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = (updater: string | ((prev: string) => string)): void => {
    const newValue = typeof updater === "function" ? updater(value) : updater;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const setCursor = (
    updater: number | ((prev: number) => number),
    valueForCalculation?: string,
  ): void => {
    const newCursor = typeof updater === "function" ? updater(cursor) : updater;
    if (!isControlled) {
      setInternalCursor(newCursor);
    }
    if (onCursorChange) {
      const valueToUse =
        valueForCalculation !== undefined
          ? valueForCalculation
          : valueRef.current;
      const { line, column } = getCursorLineAndColumn(valueToUse, newCursor);
      const newPosition: [number, number] = [line, column];
      if (
        lastReportedPosition.current === null ||
        lastReportedPosition.current[0] !== newPosition[0] ||
        lastReportedPosition.current[1] !== newPosition[1]
      ) {
        lastReportedPosition.current = newPosition;
        onCursorChange(newPosition);
      }
    }
  };

  return { value, cursor, setValue, setCursor };
};
