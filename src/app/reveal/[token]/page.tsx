'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import { Gift, AlertCircle, Loader2, Sparkles, Home, ArrowLeft } from 'lucide-react';
import ScratchCard from '@/components/ScratchCard';
import { RevealData } from '@/lib/types';

interface PageProps {
  params: Promise<{ token: string }>;
}

function RevealContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RevealData | null>(null);

  useEffect(() => {
    async function fetchReveal() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/reveal/${token}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || 'Lien de tirage invalide ou introuvable.');
        } else {
          setData(json.data);
        }
      } catch (err: unknown) {
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchReveal();
    }
  }, [token]);

  const handleRevealed = async () => {
    try {
      await fetch(`/api/reveal/${token}`, { method: 'POST' });
    } catch {
      // Ignore background post failure
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center animate-pulse">
            <Gift className="w-8 h-8 text-rose-400 animate-bounce" />
          </div>
          <div className="flex items-center gap-2 text-rose-200 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement de ton enveloppe secrète...
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/80 border border-rose-500/30 text-center shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Lien introuvable</h2>
          <p className="text-xs sm:text-sm text-rose-200/80 mb-6">
            {error || 'Ce lien de tirage au sort n\'est plus disponible ou a été modifié.'}
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retourner à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 text-white relative overflow-hidden">
      {/* Festive Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-4 shadow-sm backdrop-blur-md">
          <Gift className="w-4 h-4 text-rose-400" />
          <span>{data.sessionTitle || 'Secret Santa'}</span>
        </div>

        {/* Greeting */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-amber-200 mb-2">
          Bonjour {data.giverName} !
        </h1>

        <p className="text-sm sm:text-base text-rose-200/80 text-center max-w-md mb-8">
          Ton enveloppe secrète t&apos;attend. Gratte la zone ci-dessous pour découvrir à qui tu dois offrir un cadeau !
        </p>

        {/* Interactive Scratch Card */}
        <ScratchCard
          receiverName={data.receiverName}
          giverName={data.giverName}
          eventTitle={data.sessionTitle}
          budget={data.budget}
          message={data.message}
          initiallyRevealed={data.revealed}
          onRevealed={handleRevealed}
        />

        {/* Footer info */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-rose-300/70 hover:text-white transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Créer ton propre Secret Santa
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function RevealPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center animate-pulse">
              <Gift className="w-8 h-8 text-rose-400" />
            </div>
            <div className="flex items-center gap-2 text-rose-200 text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement...
            </div>
          </div>
        </main>
      }
    >
      <RevealContent {...props} />
    </Suspense>
  );
}
