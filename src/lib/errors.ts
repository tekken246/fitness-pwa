export class AppError extends Error {
  readonly code: string;

  /** Creates a typed application error safe to expose to the UI. */
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/** Converts unknown exceptions into a user-safe message. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error.';
}
