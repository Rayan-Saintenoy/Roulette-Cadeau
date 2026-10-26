'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  RotateCw,
  X,
  Share2,
} from 'lucide-react';
import { EmailProgress } from '@/lib/types';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressList: EmailProgress[];
  isProcessing: boolean;
  onRetryFailed: () => void;
  isDemoMode: boolean;
}

export default function ProgressModal({
  isOpen,
  onClose,
  progressList,
  isProcessing,
  onRetryFailed,
  isDemoMode,
}: ProgressModalProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  if (!isOpen) return null;

  const total = progressList.length;
  const successCount = progressList.filter((p) => p.status === 'success').length;
  const errorCount = progressList.filter((p) => p.status === 'error').length;
  const percent = total > 0 ? Math.round(((successCount + errorCount) / total) * 100) : 0;

  const handleCopySingle = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCopyAll = () => {
    const text = progressList
      .map((p) => `🎁 ${p.name} (${p.email}) :\n👉 Lien secret : ${p.revealUrl}\n`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi des tirages en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  Tirage effectué avec succès !
                </>
              )}
            </h3>
            <p className="text-xs text-emerald-100 mt-1">
              {isDemoMode ? 'Mode simulation actif (liens générés avec succès)' : 'Distribution des emails aux participants'}
            </p>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar Header */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
            <span>
              Progression : {successCount}/{total} emails envoyés
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* List of participants and statuses */}
        <div className="p-6 space-y-2.5 overflow-y-auto flex-1">
          {progressList.map((item) => (
            <div
              key={item.token}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-slate-400 truncate">&lt;{item.email}&gt;</span>
                </div>

                {item.error && (
                  <p className="text-xs text-rose-500 mt-0.5 truncate">{item.error}</p>
                )}
              </div>

              {/* Status & Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Status Badge */}
                {item.status === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    <Clock className="w-3 h-3" /> En attente
                  </span>
                )}
                {item.status === 'sending' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-600" /> Envoi...
                  </span>
                )}
                {item.status === 'success' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Succès
                  </span>
                )}
                {item.status === 'error' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    <XCircle className="w-3 h-3 text-rose-600" /> Échec
                  </span>
                )}

                {/* Open Reveal link button */}
                <a
                  href={item.revealUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Tester la page à gratter de ce participant"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Copy single link button */}
                <button
                  type="button"
                  onClick={() => handleCopySingle(item.revealUrl, item.token)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Copier le lien secret"
                >
                  {copiedToken === item.token ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600 font-semibold">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyAll}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            {allCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tous les liens copiés !</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Copier tous les liens (WhatsApp, SMS...)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {errorCount > 0 && !isProcessing && (
              <button
                type="button"
                onClick={onRetryFailed}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Réessayer les échecs ({errorCount})
              </button>
            )}

            {!isProcessing && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Terminer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
