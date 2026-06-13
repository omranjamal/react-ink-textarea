import { useState, useEffect, useRef } from "react";

type UseCursorBlinkOptions = {
  isActive: boolean;
  cursorInterval: number;
  typingPause: number;
  disableCursorBlink: boolean;
};

type UseCursorBlinkReturn = {
  cursorVisible: boolean;
  resetBlink: () => void;
};

export const useCursorBlink = ({
  isActive,
  cursorInterval,
  typingPause,
  disableCursorBlink,
}: UseCursorBlinkOptions): UseCursorBlinkReturn => {
  const [cursorVisible, setCursorVisible] = useState(true);
  const blinkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const clearAll = (): void => {
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!isActive || disableCursorBlink) {
      clearAll();
      setCursorVisible(true);
      return;
    }

    blinkIntervalRef.current = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, cursorInterval);

    return clearAll;
  }, [isActive, cursorInterval, disableCursorBlink]);

  const resetBlink = (): void => {
    setCursorVisible(true);
    clearAll();

    if (disableCursorBlink) return;

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
      if (!isActiveRef.current) return;
      blinkIntervalRef.current = setInterval(() => {
        setCursorVisible((prev) => !prev);
      }, cursorInterval);
    }, typingPause);
  };

  return { cursorVisible, resetBlink };
};
