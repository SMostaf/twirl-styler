import React from 'react';
import { AppView } from '../types';

interface Props {
  onStart: () => void;
  onViewChange: (view: AppView) => void;
}

const LandingPage: React.FC<Props> = ({ onStart, onViewChange }) => {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-4xl">🧠</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          <span className="text-violet-600">Neuro</span><span className="text-cyan-600">Path</span>
        </h1>
        <p className="text-xl text-stone-600 max-w-2xl mx-auto mb-4 leading-relaxed">
          Your nervous system, quantified. Your recovery, guided.
        </p>

        {/* Product Description — prominent */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 mb-8 max-w-3xl mx-auto shadow-sm">
          <p className="text-base md:text-lg text-stone-700 leading-relaxed">
            NeuroPath turns wearable, voice, sleep, and behavioral signals into a personalized model of 
            nervous system regulation, helping people understand their stress patterns and track recovery over time.
          </p>
        </div>

        {/* 3-Step Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-left shadow-sm">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mb-4">
              <span className="text-violet-600 font-bold text-lg">1</span>
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">Connect Your Data</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Link your Apple Watch, wearable, or voice check-ins. NeuroPath continuously gathers 
              heart rate variability, sleep architecture, respiratory patterns, and voice biomarkers.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-left shadow-sm">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center mb-4">
              <span className="text-cyan-600 font-bold text-lg">2</span>
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">Build Your Digital Twin</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Our AI engine maps your unique biometric patterns onto a Polyvagal model of your 
              nervous system — showing you exactly which state you're in and why.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-left shadow-sm">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <span className="text-emerald-600 font-bold text-lg">3</span>
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">Recover With Precision</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Get personalized, data-driven interventions — breathwork, somatic practices, sleep 
              optimization — tailored to your real-time nervous system state. Track your progress with objective KPIs.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300"
        >
          Join the Pilot
          <span className="text-lg">→</span>
        </button>
        <p className="text-sm text-stone-500 mt-3">Help us validate NeuroPath — be among the first to map your nervous system</p>
      </section>

      {/* About / Mission */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-stone-200">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Our Mission</h2>
          <p className="text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Millions of people struggle with anxiety, burnout, and trauma without objective feedback 
            on what's actually happening in their nervous system. We believe that understanding your 
            autonomic state — moment to moment, day to day — is the foundation of genuine recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔬</span>
              <h3 className="font-semibold text-stone-900">Science-Driven</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              Built on Polyvagal Theory, HRV biofeedback research, and clinical trauma recovery 
              protocols. Every intervention is evidence-based.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔒</span>
              <h3 className="font-semibold text-stone-900">Privacy-First</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              Raw biometrics and voice audio are processed on-device. Only anonymous feature vectors 
              leave your device. Your nervous system data belongs to you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-4xl mx-auto px-6 py-12 border-t border-stone-200 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Contact Us</h2>
        <p className="text-stone-600 mb-2">
          Questions, feedback, or interested in partnering?
        </p>
        <a
          href="mailto:contacttwirl@gmail.com"
          className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-sm">mail</span>
          contacttwirl@gmail.com
        </a>

        {/* Team Section */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
            <div className="text-3xl mb-2">🧠</div>
            <h4 className="font-semibold text-stone-900 text-sm">Product & Research</h4>
            <p className="text-xs text-stone-500 mt-1">Neuroscience, product design, clinical validation</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
            <div className="text-3xl mb-2">⚡</div>
            <h4 className="font-semibold text-stone-900 text-sm">Engineering</h4>
            <p className="text-xs text-stone-500 mt-1">Biometric processing, AI twin, voice analysis</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
            <div className="text-3xl mb-2">🌿</div>
            <h4 className="font-semibold text-stone-900 text-sm">Clinical Advisory</h4>
            <p className="text-xs text-stone-500 mt-1">Trauma specialists, somatic practitioners, researchers</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-400">
        <p>© 2026 NeuroPath · Privacy-first nervous system tracking</p>
      </footer>
    </div>
  );
};

export default LandingPage;