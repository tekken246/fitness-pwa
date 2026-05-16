import { describe, expect, it } from 'vitest';

import { AppError } from '@/lib/errors';
import { assertUserScopedRecord } from '@/lib/security';

describe('authorization helpers', () => {
  it('allows matching Clerk owners', () => {
    expect(() => assertUserScopedRecord({ clerkUserId: 'user_a' }, 'user_a')).not.toThrow();
  });

  it('blocks mismatched Clerk owners', () => {
    expect(() => assertUserScopedRecord({ clerkUserId: 'user_b' }, 'user_a')).toThrow(AppError);
  });
});
