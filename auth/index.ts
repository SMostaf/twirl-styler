/**
 * Clerk authentication wrapper for NeuroPath.
 *
 * Wraps the app with ClerkProvider and provides auth-protected view routing.
 * Uses VITE_CLERK_PUBLISHABLE_KEY from environment (Vite convention).
 *
 * Required env vars:
 *   VITE_CLERK_PUBLISHABLE_KEY — Clerk frontend API key (starts with pk_)
 */
export { AuthWrapper } from './AuthWrapper';
export { SignInPage } from './SignInPage';
export { SignUpPage } from './SignUpPage';
