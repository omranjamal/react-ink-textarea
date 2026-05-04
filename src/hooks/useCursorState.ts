import { useState, useEffect, useRef } from "react";
import { getCursorFromLineColumn } from "../textUtils.js";

const normalizeNewlines = (s: string): string =>
  s.indexOf("\r") === -1 ? s : s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

type UseCursorStateOptions = {
  controlledValue: string | undefined;
  controlledPosition: [number, number] | undefined;
  onChange: ((value: string) => void) | undefined;
  onCursorAttempt:
    | ((newCursor: number, valueForCalculation?: string) => void)
    | undefined;
};

export type SetCursor = {
  (updater: (prev: number) => number): void;
  (value: number, valueForCalculation?: string): void;
};

type UseCursorStateReturn = {
  value: string;
  cursor: number;
  setValue: (updater: string | ((prev: string) => string)) => void;
  setCursor: SetCursor;
};

export const useCursorState = ({
  controlledValue,
  controlledPosition,
  onChange,
  onCursorAttempt,
}: UseCursorStateOptions): UseCursorStateReturn => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState("");
  const [internalCursor, setInternalCursor] = useState(0);

  const rawValue = isControlled ? controlledValue : internalValue;
  const value = normalizeNewlines(rawValue);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const processExternalPosition = (): {
    cursor: number;
    wasClamped: boolean;
  } => {
    if (controlledPosition === undefined) {
      const clamped = Math.max(0, Math.min(internalCursor, value.length));
      return { cursor: clamped, wasClamped: clamped !== internalCursor };
    }
    const [line, col] = controlledPosition;
    const { cursor, clampedLine, clampedCol } = getCursorFromLineColumn(
      value,
      line,
      col,
    );
    return {
      cursor,
      wasClamped: line !== clampedLine || col !== clampedCol,
    };
  };

  const { cursor, wasClamped } = processExternalPosition();

  const lastClampDispatchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!wasClamped) return;
    if (lastClampDispatchRef.current === cursor) return;
    lastClampDispatchRef.current = cursor;
    onCursorAttempt?.(cursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasClamped, cursor]);

  const setValue = (updater: string | ((prev: string) => string)): void => {
    const newValue = typeof updater === "function" ? updater(value) : updater;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const isCursorControlled = controlledPosition !== undefined;

  const setCursor = (
    updater: number | ((prev: number) => number),
    valueForCalculation?: string,
  ): void => {
    const newCursor = typeof updater === "function" ? updater(cursor) : updater;
    if (!isCursorControlled) {
      setInternalCursor(newCursor);
    }
    if (onCursorAttempt) {
      onCursorAttempt(newCursor, valueForCalculation);
    }
  };

  return { value, cursor, setValue, setCursor };
};
