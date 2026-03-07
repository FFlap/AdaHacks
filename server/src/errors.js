export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function toErrorResponse(error) {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      payload: {
        error: {
          message: error.message,
          code: error.code
        }
      }
    };
  }

  if (error?.name === 'ZodError') {
    return {
      status: 400,
      payload: {
        error: {
          message: error.issues?.[0]?.message ?? 'Invalid request payload',
          code: 'validation_error'
        }
      }
    };
  }

  return {
    status: 500,
    payload: {
      error: {
        code: 'internal_error',
        message: 'Internal server error'
      }
    }
  };
}
