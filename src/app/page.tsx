'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ParticipantForm from '@/components/ParticipantForm';
import EmailConfigModal from '@/components/EmailConfigModal';
import ProgressModal from '@/components/ProgressModal';
import { Participant, EmailJSConfig, EmailProgress } from '@/lib/types';
import { sendSecretSantaEmail } from '@/lib/emailjs';
import {
  Send,
  Sparkles,
  ShieldCheck,
  MailCheck,
  Settings,
  AlertCircle,
  Dice5,
} from 'lucide-react';

export default function Home() {
  const [title, setTitle] = useState('Secret Santa de Noël 🎄');
  const [budget, setBudget] = useState('15 - 20€');
  const [message, setMessage] = useState('Rendez-vous le 24 décembre pour l\'échange de cadeaux !');

  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Alice', email: 'alice@example.com', exclusions: [] },
    { id: '2', name: 'Bob', email: 'bob@example.com', exclusions: [] },
    { id: '3', name: 'Charlie', email: 'charlie@example.com', exclusions: [] },
  ]);

  const [emailConfig, setEmailConfig] = useState<EmailJSConfig>({
    serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
    templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
    publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '',
  });

  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressList, setProgressList] = useState<EmailProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load config from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('secret_santa_emailjs_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.serviceId && parsed.templateId && parsed.publicKey) {
          setEmailConfig(parsed);
          setIsDemoMode(false);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleSaveEmailConfig = (config: EmailJSConfig, demo: boolean) => {
    setEmailConfig(config);
    setIsDemoMode(demo);
    try {
      localStorage.setItem('secret_santa_emailjs_config', JSON.stringify(config));
    } catch {
      // Ignore
    }
  };

  const isEmailConfigured =
    Boolean(emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey);

  // Validation
  const validateForm = (): string | null => {
    if (participants.length < 3) {
      return 'Au moins 3 participants sont requis.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const p of participants) {
      if (!p.name.trim()) {
        return 'Chaque participant doit avoir un nom.';
      }
      if (!p.email.trim() || !emailRegex.test(p.email.trim())) {
        return `L'adresse email pour "${p.name || 'un participant'}" est invalide.`;
      }
    }

    // Check if exclusions make it impossible
    for (const p of participants) {
      const totalPossible = participants.filter(
        (other) => other.id !== p.id && !(p.exclusions || []).includes(other.id)
      ).length;
      if (totalPossible === 0) {
        return `Le participant "${p.name}" a exclu tous les autres participants possibles.`;
      }
    }

    return null;
  };

  const handleLaunchDraw = async () => {
    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    // Warn if real mode selected but keys not set
    if (!isDemoMode && !isEmailConfigured) {
      setIsConfigModalOpen(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Call /api/draw to generate the matching securely on server
      const res = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          budget,
          message,
          participants,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la génération du tirage.');
      }

      const pairs: Array<{
        giverId: string;
        giverName: string;
        giverEmail: string;
        token: string;
        revealUrl: string;
      }> = json.pairs;

      // Initialize progress
      const initialProgress: EmailProgress[] = pairs.map((pair) => ({
        participantId: pair.giverId,
        name: pair.giverName,
        email: pair.giverEmail,
        status: 'pending',
        token: pair.token,
        revealUrl: pair.revealUrl,
      }));

      setProgressList(initialProgress);
      setIsProgressModalOpen(true);

      // Process sending sequentially
      await processEmailSending(initialProgress);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue.';
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processEmailSending = async (items: EmailProgress[]) => {
    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (item.status === 'success') continue;

      // Mark sending
      updated[i] = { ...item, status: 'sending', error: undefined };
      setProgressList([...updated]);

      if (isDemoMode) {
        // Simulation delay
        await new Promise((resolve) => setTimeout(resolve, 400));
        updated[i] = { ...item, status: 'success' };
      } else {
        // Real EmailJS send
        const result = await sendSecretSantaEmail(emailConfig, {
          toName: item.name,
          toEmail: item.email,
          revealUrl: item.revealUrl,
          eventTitle: title,
          budget,
          customMessage: message,
        });

        if (result.success) {
          updated[i] = { ...item, status: 'success' };
        } else {
          updated[i] = { ...item, status: 'error', error: result.error };
        }
      }

      setProgressList([...updated]);
    }
  };

  const handleRetryFailed = async () => {
    setIsProcessing(true);
    await processEmailSending(progressList);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-rose-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <Header
        onOpenEmailConfig={() => setIsConfigModalOpen(true)}
        isEmailConfigured={isEmailConfigured}
        isDemoMode={isDemoMode}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Tirage au sort Secret Santa & cartes à gratter
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Offrez du suspense à vos cadeaux.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Générez un tirage sans triche avec exclusion de couples. Chaque participant reçoit son lien secret et découvre son tirage avec une <strong>carte à gratter interactive</strong> !
          </p>

          {/* Quick info banner */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% confidentiel (aucun nom dans l&apos;URL)
            </span>
            <span className="flex items-center gap-1.5">
              <MailCheck className="w-4 h-4 text-rose-500" />
              Envoi EmailJS automatique
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Animation à gratter + confettis
            </span>
          </div>
        </div>

        {/* Demo Mode Notice Badge */}
        {isDemoMode && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Dice5 className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Mode Simulation activé :</strong> Vous pouvez tester le tirage et ouvrir les cartes à gratter instantanément sans configurer EmailJS.
              </span>
            </div>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-semibold transition-colors cursor-pointer flex-shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              Configurer EmailJS
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="flex-1 font-medium">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Participants & Event Form */}
        <ParticipantForm
          participants={participants}
          onChange={setParticipants}
          title={title}
          onTitleChange={setTitle}
          budget={budget}
          onBudgetChange={setBudget}
          message={message}
          onMessageChange={setMessage}
        />

        {/* Big Launch Draw CTA */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white text-sm font-bold">3</span>
              Prêt pour le tirage ?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {participants.length} participants prêts • {isDemoMode ? 'Mode simulation (test rapide)' : 'Envoi réel via EmailJS'}
            </p>
          </div>

          <button
            onClick={handleLaunchDraw}
            disabled={isProcessing}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-700 hover:via-red-700 hover:to-amber-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-rose-600/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span>Lancer le tirage et envoyer les emails</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>Roulette Cadeau • Secret Santa avec Next.js & EmailJS • Confidentialité garantie</p>
      </footer>

      {/* Modals */}
      <EmailConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={emailConfig}
        onSave={handleSaveEmailConfig}
        isDemoMode={isDemoMode}
      />

      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        progressList={progressList}
        isProcessing={isProcessing}
        onRetryFailed={handleRetryFailed}
        isDemoMode={isDemoMode}
      />
    </div>
  );
}
