import { SignIn } from '@clerk/nextjs';
import type { ReactNode } from 'react';

/** Renders the Clerk sign-in flow. */
export default function SignInPage(): ReactNode {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <SignIn fallbackRedirectUrl="/today" />
    </main>
  );
}
