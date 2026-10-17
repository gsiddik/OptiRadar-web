const parseJson = (text) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

// A failed call to the server, with what the screen needs to explain it: the HTTP status, the stable error code of the
// server (governance_*, delegation_*), the correlation id to quote to support and how long to wait before retrying.
class ApiError extends Error {
  constructor({ status, code, message, correlationId, retryAfter, details, nexusCode, network }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || null;
    this.correlationId = correlationId || null;
    this.retryAfter = retryAfter || 0;
    this.details = details || null;
    this.nexusCode = nexusCode || null;
    this.network = Boolean(network);
  }

  get forbidden() {
    return this.status === 403;
  }

  get unavailable() {
    return this.status === 503 || this.status === 502 || this.status === 504 || this.network;
  }

  get sessionEnded() {
    return this.status === 401;
  }

  // The server ended the access of this person (OptiNexus said so): the session is over.
  get accessRevoked() {
    return this.code === 'governance_access_revoked';
  }

  static async fromResponse(response) {
    const text = await response.text().catch(() => '');
    const body = parseJson(text);
    const retry = Number.parseInt(response.headers.get('Retry-After') || '', 10);
    const correlationId =
      response.headers.get('X-Correlation-Id') || (body && body.correlationId) || null;
    if (body && typeof body === 'object' && typeof body.error === 'string') {
      const reference = correlationId ? ` [${correlationId}]` : '';
      return new ApiError({
        status: response.status,
        code: body.error,
        message: `${body.message || body.error}${reference}`,
        correlationId,
        retryAfter: Number.isFinite(retry) ? retry : 0,
        details: body.details,
        nexusCode: body.nexusCode,
      });
    }
    // Everything else keeps the text of the answer as the message, as before.
    return new ApiError({
      status: response.status,
      message: text || response.statusText,
      correlationId,
      retryAfter: Number.isFinite(retry) ? retry : 0,
    });
  }

  static fromNetwork(error) {
    return new ApiError({
      status: 0,
      message: error && error.message ? error.message : 'Network error',
      network: true,
    });
  }
}

export default ApiError;
