import { useRef, useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { messagesActions } from './store';
import ApiError from './common/util/ApiError';

export const pageSize = 50;

// What to put in the message bar for a failed call: the words of the server, with the code and reference of a known
// refusal so the bar can say it in the user's language.
export const toMessage = (error) =>
  error instanceof ApiError && error.code
    ? { message: error.message, code: error.code, correlationId: error.correlationId }
    : error.message;

export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const useAsyncTask = (effect, deps) => {
  const dispatch = useDispatch();
  useEffect(() => {
    const controller = new AbortController();
    let cleanup;
    effect({ signal: controller.signal })
      .then((result) => {
        cleanup = result;
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          dispatch(messagesActions.push(toMessage(error)));
        }
      });
    return () => {
      controller.abort();
      cleanup?.();
    };
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [...deps, dispatch]);
};

export const useCatch = (method) => {
  const dispatch = useDispatch();
  return (...parameters) => {
    method(...parameters).catch((error) => dispatch(messagesActions.push(toMessage(error))));
  };
};

export const useCatchCallback = (method, deps) => {
  const dispatch = useDispatch();
  return useCallback(
    (...parameters) => {
      method(...parameters).catch((error) => dispatch(messagesActions.push(toMessage(error))));
    },
    // eslint-disable-next-line @eslint-react/exhaustive-deps
    deps,
  );
};

export const useScrollToLoad = (loadMore) => {
  const [sentinel, setSentinel] = useState(null);
  const loadingRef = useRef(false);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loadingRef.current) {
        loadingRef.current = true;
        Promise.resolve(loadMoreRef.current?.()).finally(() => {
          loadingRef.current = false;
        });
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel]);

  return setSentinel;
};
