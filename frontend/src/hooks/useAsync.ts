import { useState } from "react";

export function useAsync<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, run };
}
