import { SignUp } from '@clerk/nextjs';
import type { ReactNode } from 'react';

/** Renders the Clerk sign-up flow. */
export default function SignUpPage(): ReactNode {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <SignUp fallbackRedirectUrl="/today" />
    </main>
  );
}
