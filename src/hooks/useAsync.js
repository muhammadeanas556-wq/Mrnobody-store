import { useCallback, useEffect, useRef, useState } from 'react';

/** Run an async loader when deps change; returns { data, loading, error, reload }. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const seq = useRef(0);
  const run = useCallback(() => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fn)
      .then((data) => id === seq.current && setState({ data, loading: false, error: null }))
      .catch((error) => id === seq.current && setState({ data: null, loading: false, error }));
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}
