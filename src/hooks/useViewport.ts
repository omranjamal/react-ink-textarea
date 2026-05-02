import { useEffect, useState } from "react";

type UseViewportOptions = {
  rowCount: number;
  viewportLines: number;
  cursorRowIndex: number;
};

type UseViewportReturn = {
  visibleRowStart: number;
  visibleRowEnd: number;
};

export const useViewport = ({
  rowCount,
  viewportLines,
  cursorRowIndex,
}: UseViewportOptions): UseViewportReturn => {
  const [scrollOffset, setScrollOffset] = useState(0);

  const cap = Number.isFinite(viewportLines)
    ? Math.max(1, viewportLines)
    : Number.POSITIVE_INFINITY;

  useEffect(() => {
    if (!Number.isFinite(cap)) {
      if (scrollOffset !== 0) setScrollOffset(0);
      return;
    }
    const maxOffset = Math.max(0, rowCount - cap);
    let next = scrollOffset;
    if (cursorRowIndex >= 0 && cursorRowIndex < scrollOffset) {
      next = cursorRowIndex;
    } else if (cursorRowIndex >= scrollOffset + cap) {
      next = cursorRowIndex - cap + 1;
    }
    next = Math.min(maxOffset, Math.max(0, next));
    if (next !== scrollOffset) setScrollOffset(next);
  }, [cursorRowIndex, rowCount, cap, scrollOffset]);

  if (!Number.isFinite(cap)) {
    return { visibleRowStart: 0, visibleRowEnd: rowCount };
  }
  const start = Math.min(scrollOffset, Math.max(0, rowCount - cap));
  const end = Math.min(rowCount, start + cap);
  return { visibleRowStart: start, visibleRowEnd: end };
};
