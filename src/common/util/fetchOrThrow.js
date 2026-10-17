import ApiError from './ApiError';
import { announceSessionEnded, isSessionCall } from './sessionEvents';

export default async (input, init) => {
  let response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw error;
    }
    throw ApiError.fromNetwork(error);
  }
  if (!response.ok) {
    const error = await ApiError.fromResponse(response);
    if (error.sessionEnded && !isSessionCall(input)) {
      announceSessionEnded(error);
    }
    throw error;
  }
  return response;
};
