// Error handling

// CustomError offers code and data properties
class CustomError extends Error {
  code: string;
  data: unknown;
  constructor(message: string, code?: string, data?: unknown) {
    super(message);
    this.code = code || '';
    this.data = data || {};
  }
}

class ValidationError extends CustomError {}

export { CustomError, ValidationError };
