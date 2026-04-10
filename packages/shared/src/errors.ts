import { ERROR_CODES } from './constants';

export class ForgeIDError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'ForgeIDError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        doc_url: `https://forgeid.ai/docs/errors/${this.code}`,
      },
    };
  }
}

export class AuthenticationError extends ForgeIDError {
  constructor(message: string = 'Authentication required') {
    super(ERROR_CODES.AUTHENTICATION_REQUIRED, message, 401);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends ForgeIDError {
  constructor(message: string = 'Permission denied') {
    super(ERROR_CODES.PERMISSION_DENIED, message, 403);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends ForgeIDError {
  constructor(message: string = 'Resource not found') {
    super(ERROR_CODES.NOT_FOUND, message, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ForgeIDError {
  constructor(message: string = 'Rate limit exceeded') {
    super(ERROR_CODES.RATE_LIMITED, message, 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends ForgeIDError {
  constructor(message: string = 'Validation failed') {
    super(ERROR_CODES.VALIDATION_ERROR, message, 400);
    this.name = 'ValidationError';
  }
}

export class InternalError extends ForgeIDError {
  constructor(message: string = 'Internal server error') {
    super(ERROR_CODES.INTERNAL_ERROR, message, 500);
    this.name = 'InternalError';
  }
}
