import { useState, useEffect, useRef, useMemo } from "react";
import {
  buildDynamicRuns,
  type Segment,
  type TextProps,
} from "../textUtils.js";
import type { TDynamicStyle } from "../types.js";

type UseDynamicStylesOptions = {
  // Run timers only while the textarea is focused (mirrors cursor blink).
  isActive: boolean;
  value: string;
  // Segments already filtered to dynamic labels.
  segments: readonly Segment[];
  dynamicByLabel: Record<string, TDynamicStyle>;
};

const EMPTY: Map<number, TextProps> = new Map();

// Drives function-based ("dynamic") label styles: computes the per-grapheme
// Ink props for every dynamic run and schedules its own re-renders based on
// each run's `nextAfter`, carrying `nextMeta` between frames. State is
// per-occurrence (keyed by run start), so separate matches update
// independently. Timers run only while `isActive`.
export const useDynamicStyles = ({
  isActive,
  value,
  segments,
  dynamicByLabel,
}: UseDynamicStylesOptions): Map<number, TextProps> => {
  const hasDynamic = Object.keys(dynamicByLabel).length > 0;
  const [metaByRun, setMetaByRun] = useState<Record<string, unknown>>({});
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const clearAllTimers = (): void => {
    for (const t of timersRef.current.values()) clearTimeout(t);
    timersRef.current.clear();
  };

  const { charProps, timings, liveRunKeys } = useMemo(
    () => buildDynamicRuns(value, segments, dynamicByLabel, metaByRun),
    [value, segments, dynamicByLabel, metaByRun],
  );

  useEffect(() => {
    if (!isActive || !hasDynamic) {
      clearAllTimers();
      return;
    }

    // Drop meta for runs that no longer exist (edits/removals). Returns the
    // previous object unchanged when nothing was pruned, so this does not
    // spin the render loop.
    setMetaByRun((prev) => {
      let changed = false;
      const next: Record<string, unknown> = {};
      for (const k of Object.keys(prev)) {
        if (liveRunKeys.has(k)) next[k] = prev[k];
        else changed = true;
      }
      return changed ? next : prev;
    });

    // Clear timers for runs that are gone.
    for (const k of [...timersRef.current.keys()]) {
      if (!liveRunKeys.has(k)) {
        clearTimeout(timersRef.current.get(k)!);
        timersRef.current.delete(k);
      }
    }

    // (Re)schedule one timer per run requesting a re-render. Rescheduling
    // with fresh `nextMeta` each frame keeps the carried state current.
    for (const { runKey, nextAfter, nextMeta } of timings) {
      const existing = timersRef.current.get(runKey);
      if (existing) clearTimeout(existing);
      timersRef.current.set(
        runKey,
        setTimeout(() => {
          timersRef.current.delete(runKey);
          setMetaByRun((prev) => ({ ...prev, [runKey]: nextMeta }));
        }, nextAfter),
      );
    }
  }, [isActive, hasDynamic, timings, liveRunKeys]);

  // Clear all timers on unmount.
  useEffect(() => clearAllTimers, []);

  return hasDynamic ? charProps : EMPTY;
};
