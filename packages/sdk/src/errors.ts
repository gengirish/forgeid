/** JSON error envelope returned by the ForgeID API. */
export interface ForgeIDApiErrorBody {
  error: {
    code: string;
    message: string;
    doc_url: string;
  };
}

/**
 * Error thrown when the ForgeID API returns a non-success status or the request fails.
 * Mirrors Stripe-style errors: code, HTTP status, message, and documentation URL.
 */
export class ForgeIDSDKError extends Error {
  override readonly name = 'ForgeIDSDKError';

  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly docUrl: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static fromResponse(body: unknown, statusCode: number): ForgeIDSDKError {
    if (body && typeof body === 'object' && 'error' in body) {
      const err = (body as ForgeIDApiErrorBody).error;
      if (err && typeof err.code === 'string' && typeof err.message === 'string') {
        return new ForgeIDSDKError(
          err.code,
          err.message,
          statusCode,
          typeof err.doc_url === 'string' ? err.doc_url : `https://forgeid.ai/docs/errors/${err.code}`,
        );
      }
    }
    return new ForgeIDSDKError(
      'unknown_error',
      `Request failed with status ${statusCode}`,
      statusCode,
      'https://forgeid.ai/docs/errors/unknown_error',
    );
  }

  static requestFailed(message: string, statusCode = 0): ForgeIDSDKError {
    return new ForgeIDSDKError('request_failed', message, statusCode, 'https://forgeid.ai/docs/errors/request_failed');
  }
}
