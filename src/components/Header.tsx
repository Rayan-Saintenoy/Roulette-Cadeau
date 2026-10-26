'use client';

import React from 'react';
import { Gift, Mail, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenEmailConfig: () => void;
  isEmailConfigured: boolean;
  isDemoMode: boolean;
}

export default function Header({
  onOpenEmailConfig,
  isEmailConfigured,
  isDemoMode,
}: HeaderProps) {
  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
            <Gift className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              Roulette Cadeau
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                Secret Santa
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Tirage au sort & cartes à gratter secrètes
            </p>
          </div>
        </div>

        {/* Action Button: EmailJS Configuration */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenEmailConfig}
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">Configuration</span> EmailJS
            {isDemoMode ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title="Mode démo actif" />
            ) : isEmailConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="EmailJS configuré" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-rose-400" title="EmailJS non configuré" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
