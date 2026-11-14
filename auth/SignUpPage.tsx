import React from 'react';
import { SignUp } from '@clerk/clerk-react';

/**
 * Dedicated sign-up page for NeuroPath.
 * Styled to match the dark neuroscience-inspired theme.
 */
export const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          <span className="text-violet-600">Neuro</span><span className="text-cyan-600">Path</span>
        </h1>
        <p className="text-stone-500 text-sm mt-2">Create your autonomic twin account</p>
      </div>
      <div className="w-full max-w-sm">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-white border border-stone-300 shadow-xl rounded-2xl',
              headerTitle: 'text-stone-900 text-xl',
              headerSubtitle: 'text-stone-600',
              socialButtonsBlockButton: 'bg-stone-200 border-stone-400 text-stone-900 hover:bg-stone-300',
              formButtonPrimary: 'bg-violet-600 hover:bg-violet-600 text-stone-900',
              formFieldLabel: 'text-stone-700',
              formFieldInput: 'bg-stone-200 border-stone-400 text-stone-900',
              footerActionLink: 'text-violet-600 hover:text-violet-300',
              dividerLine: 'bg-stone-300',
              dividerText: 'text-stone-500',
            },
          }}
          signInUrl="/sign-in"
          afterSignUpUrl="/"
        />
      </div>
    </div>
  );
};
