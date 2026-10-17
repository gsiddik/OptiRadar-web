import ApiError from './ApiError';

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
    throw await ApiError.fromResponse(response);
  }
  return response;
};
