import { useRef } from "react";

type TUndoEntry = { readonly value: string; readonly cursor: number };
type TMutationType = "insert" | "delete";

type UseUndoOptions = {
  maxUndo: number;
  undoGroupDelay: number;
};

type UseUndoReturn = {
  pushUndo: (type: TMutationType, value: string, cursor: number) => void;
  undo: (value: string, cursor: number) => TUndoEntry | undefined;
  redo: (value: string, cursor: number) => TUndoEntry | undefined;
  resetMutationTracking: () => void;
};

export const useUndo = ({
  maxUndo,
  undoGroupDelay,
}: UseUndoOptions): UseUndoReturn => {
  const undoStack = useRef<TUndoEntry[]>([]);
  const redoStack = useRef<TUndoEntry[]>([]);
  const lastMutationTime = useRef(0);
  const lastMutationType = useRef<TMutationType | null>(null);

  const pushCapped = (stack: TUndoEntry[], entry: TUndoEntry): void => {
    if (stack.length >= maxUndo) {
      stack.shift();
    }
    stack.push(entry);
  };

  const pushUndo = (
    type: TMutationType,
    value: string,
    cursor: number,
  ): void => {
    // Any fresh edit invalidates the redo history.
    redoStack.current.length = 0;

    const now = Date.now();
    const elapsed = now - lastMutationTime.current;
    const sameType = type === lastMutationType.current;

    lastMutationTime.current = now;
    lastMutationType.current = type;

    if (elapsed < undoGroupDelay && sameType) {
      return;
    }

    pushCapped(undoStack.current, { value, cursor });
  };

  const undo = (value: string, cursor: number): TUndoEntry | undefined => {
    const entry = undoStack.current.pop();
    if (entry) {
      pushCapped(redoStack.current, { value, cursor });
    }
    return entry;
  };

  const redo = (value: string, cursor: number): TUndoEntry | undefined => {
    const entry = redoStack.current.pop();
    if (entry) {
      pushCapped(undoStack.current, { value, cursor });
    }
    return entry;
  };

  const resetMutationTracking = (): void => {
    lastMutationTime.current = 0;
    lastMutationType.current = null;
  };

  return { pushUndo, undo, redo, resetMutationTracking };
};
