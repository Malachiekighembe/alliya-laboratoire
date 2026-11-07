import { useState, useEffect, useCallback } from 'react';
import { api, AsyncResult } from '@/lib/api-client';

export function useAsync<T>(
  fetcher: () => Promise<AsyncResult<T>>,
  options: { enabled?: boolean } = {},
): AsyncResult<T> & { refetch: () => Promise<void> } {
  const { enabled = true } = options;
  const [result, setResult] = useState<AsyncResult<T>>({
    data: null,
    error: null,
    loading: enabled,
  });

  const execute = useCallback(async () => {
    if (!enabled) return;
    setResult((prev) => ({ ...prev, loading: true, error: null }));
    const res = await fetcher();
    setResult(res);
  }, [fetcher, enabled]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...result, refetch: execute };
}
