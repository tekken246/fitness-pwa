export class AppError extends Error {
  readonly code: string;

  /** Creates a typed application error safe to expose to the UI. */
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/**
 * TEMPORARY DIAGNOSTIC VERSION.
 * Surfaces the real error text in the UI so we can identify the complete-workout
 * failure. After we've found the cause, revert this to the generic message
 * (return 'Something went wrong. Please try again.').
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  console.error('[unhandled action error]', error);

  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);

  return `DEBUG: ${detail}`;
}
