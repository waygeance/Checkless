import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generic async data fetching hook.
 *
 * @param {Function} fetcher — async function that receives an AbortSignal, returns data
 * @param {Array}    deps    — dependency array (triggers refetch on change)
 *
 * Returns { data, loading, error, refetch }
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetcherRef
      .current(controller.signal)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err);
          setLoading(false);
        }
      });
    return controller;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = run();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run };
}

/**
 * Debounced value hook.
 * Returns the debounced value after `delay` ms of inactivity.
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
