import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn(
    '[NeuroPath Auth] VITE_CLERK_PUBLISHABLE_KEY is not set. ' +
    'Authentication will be disabled. Set it in .env or environment.'
  );
}

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * AuthWrapper wraps the app content with Clerk authentication.
 * 
 * - If VITE_CLERK_PUBLISHABLE_KEY is set: unauthenticated users see the sign-in page,
 *   authenticated users see the app content.
 * - If the key is missing: renders children directly (auth-disabled mode for development).
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  // If no Clerk key configured, run in auth-disabled dev mode
  if (!CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
};
