"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CopyStatus = "idle" | "copying" | "copied" | "error";

/** Ignore stale writes and clear feedback timers when reset or unmounted. */
export function useClipboard() {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const request = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearTimer = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  useEffect(() => () => {
    request.current++;
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    request.current++;
    clearTimer();
    setStatus("idle");
  }, [clearTimer]);

  const copy = useCallback(async (text: string) => {
    const current = ++request.current;
    clearTimer();
    setStatus("copying");
    try {
      await navigator.clipboard.writeText(text);
      if (current !== request.current) return;
      setStatus("copied");
      timer.current = setTimeout(() => {
        if (current === request.current) setStatus("idle");
      }, 2000);
    } catch {
      if (current === request.current) setStatus("error");
    }
  }, [clearTimer]);

  return { status, copy, reset };
}
