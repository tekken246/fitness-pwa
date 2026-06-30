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

  // Never surface internal error details (DB/driver messages, stack traces) to the UI.
  // Log the real error server-side and return a generic, safe message.
  console.error('[unhandled action error]', error);

  return 'Something went wrong. Please try again.';
}
