import { useState, useEffect, useCallback, useRef } from 'react';
import { AsyncResult } from '@/lib/api-client';

export function useAsync<T>(
  fetcher: () => Promise<AsyncResult<T>>,
  options: { enabled?: boolean; deps?: unknown[] } = {},
): AsyncResult<T> & { refetch: () => Promise<void> } {
  const { enabled = true, deps = [] } = options;
  const [result, setResult] = useState<AsyncResult<T>>({
    data: null,
    error: null,
    loading: enabled,
  });

  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    if (!enabled) return;
    const requestId = ++requestRef.current;
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetcherRef.current();
      if (!mountedRef.current || requestId !== requestRef.current) return;
      setResult(res);
    } catch (err: any) {
      if (!mountedRef.current || requestId !== requestRef.current) return;
      setResult({ data: null, error: err, loading: false });
    }
  }, [enabled]);

  useEffect(() => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, ...deps]);

  return { ...result, refetch: execute };
}