import { useRef } from "react";

type TUndoEntry = { readonly value: string; readonly cursor: number };
type TMutationType = "insert" | "delete";

type UseUndoOptions = {
  maxUndo: number;
  undoGroupDelay: number;
};

type UseUndoReturn = {
  pushUndo: (type: TMutationType, value: string, cursor: number) => void;
  popUndo: () => TUndoEntry | undefined;
  resetMutationTracking: () => void;
};

export const useUndo = ({
  maxUndo,
  undoGroupDelay,
}: UseUndoOptions): UseUndoReturn => {
  const undoStack = useRef<TUndoEntry[]>([]);
  const lastMutationTime = useRef(0);
  const lastMutationType = useRef<TMutationType | null>(null);

  const pushUndo = (
    type: TMutationType,
    value: string,
    cursor: number,
  ): void => {
    const now = Date.now();
    const elapsed = now - lastMutationTime.current;
    const sameType = type === lastMutationType.current;

    lastMutationTime.current = now;
    lastMutationType.current = type;

    if (elapsed < undoGroupDelay && sameType) {
      return;
    }

    const stack = undoStack.current;
    if (stack.length >= maxUndo) {
      stack.shift();
    }
    stack.push({ value, cursor });
  };

  const popUndo = (): TUndoEntry | undefined => {
    return undoStack.current.pop();
  };

  const resetMutationTracking = (): void => {
    lastMutationTime.current = 0;
    lastMutationType.current = null;
  };

  return { pushUndo, popUndo, resetMutationTracking };
};
