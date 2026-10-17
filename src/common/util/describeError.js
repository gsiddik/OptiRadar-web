import ApiError from './ApiError';

// Which of the standard screens states an error belongs to.
export const stateOf = (error) => {
  if (error instanceof ApiError) {
    if (error.sessionEnded) return 'session';
    if (error.forbidden) return 'forbidden';
    if (error.network && typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'offline';
    }
    if (error.unavailable) return 'unavailable';
  }
  return 'error';
};

// The words for an error: the server code when this screen knows it, otherwise the standard text of its state.
export const describeError = (error, t) => {
  const state = stateOf(error);
  const code = error instanceof ApiError ? error.code : null;
  const known = code ? t(`apiError_${code}`) : null;
  return {
    state,
    title: t(`state_${state}`),
    detail: known || t(`state_${state}Detail`),
    reference: error instanceof ApiError ? error.correlationId : null,
    retryAfter: error instanceof ApiError ? error.retryAfter : 0,
    code,
  };
};
