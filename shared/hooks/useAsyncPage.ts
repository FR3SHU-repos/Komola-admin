"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult } from "@/shared/lib/api/client";

export type AsyncPageState = "loading" | "ready" | "error";

export function useAsyncPage<T>(
  load: (signal: AbortSignal) => Promise<ApiResult<T>>,
  requestKey: string,
  fallbackMessage: string,
) {
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<AsyncPageState>("loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const run = async () => {
      await Promise.resolve();
      if (!active) return;
      setState("loading");
      setError("");
      try {
        const response = await loadRef.current(controller.signal);
        if (!active) return;
        if (!response.success || !response.data) {
          setError(response.message || fallbackMessage);
          setState("error");
          return;
        }
        setData(response.data);
        setState("ready");
      } catch (reason: unknown) {
        if (!active || controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : fallbackMessage);
        setState("error");
      }
    };
    void run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [fallbackMessage, refreshKey, requestKey]);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);
  return { data, state, error, refresh };
}
