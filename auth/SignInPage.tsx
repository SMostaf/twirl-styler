import React from 'react';
import { SignIn } from '@clerk/clerk-react';

/**
 * Dedicated sign-in page for NeuroPath.
 * Styled to match the dark neuroscience-inspired theme.
 */
export const SignInPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          <span className="text-violet-400">Neuro</span><span className="text-cyan-400">Path</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-2">Sign in to your autonomic twin</p>
      </div>
      <div className="w-full max-w-sm">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl',
              headerTitle: 'text-white text-xl',
              headerSubtitle: 'text-zinc-400',
              socialButtonsBlockButton: 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
              formButtonPrimary: 'bg-violet-600 hover:bg-violet-500 text-white',
              formFieldLabel: 'text-zinc-300',
              formFieldInput: 'bg-zinc-800 border-zinc-700 text-white',
              footerActionLink: 'text-violet-400 hover:text-violet-300',
              dividerLine: 'bg-zinc-700',
              dividerText: 'text-zinc-500',
              identityPreviewText: 'text-zinc-300',
              identityPreviewEditButton: 'text-violet-400',
            },
          }}
          signUpUrl="/sign-up"
          afterSignInUrl="/"
        />
      </div>
    </div>
  );
};
