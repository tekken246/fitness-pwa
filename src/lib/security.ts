import { AppError } from '@/lib/errors';

export type UserScopedRecord = {
  clerkUserId: string;
};

/** Throws when a fetched record does not belong to the authenticated Clerk user. */
export function assertUserScopedRecord(record: UserScopedRecord, expectedClerkUserId: string): void {
  if (record.clerkUserId !== expectedClerkUserId) {
    throw new AppError('forbidden', 'You do not have access to this record.');
  }
}
