import { useCallback, useEffect, useState } from 'react';

// Runs a load function when the page opens and when the dependencies change, and says in which state the screen is:
// loading, ready or error (an ApiError for the standard error views). `reload()` asks again.
export default (load, deps) => {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setResult((previous) => ({ status: 'loading', data: previous.data, error: null }));
    load(controller.signal)
      .then((data) => setResult({ status: 'ready', data, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setResult({ status: 'error', data: null, error });
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...result, reload };
};
