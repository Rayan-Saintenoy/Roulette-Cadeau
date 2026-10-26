'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Key, ShieldCheck, X, ExternalLink, HelpCircle, Check, Copy } from 'lucide-react';
import { EmailJSConfig } from '@/lib/types';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EmailJSConfig;
  onSave: (config: EmailJSConfig, isDemoMode: boolean) => void;
  isDemoMode: boolean;
}

export default function EmailConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
  isDemoMode: initialDemoMode,
}: EmailConfigModalProps) {
  const [serviceId, setServiceId] = useState(config.serviceId || '');
  const [templateId, setTemplateId] = useState(config.templateId || '');
  const [publicKey, setPublicKey] = useState(config.publicKey || '');
  const [demoMode, setDemoMode] = useState(initialDemoMode);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  useEffect(() => {
    setServiceId(config.serviceId || '');
    setTemplateId(config.templateId || '');
    setPublicKey(config.publicKey || '');
    setDemoMode(initialDemoMode);
  }, [config, initialDemoMode]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVar(text);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const handleSave = () => {
    onSave(
      {
        serviceId: serviceId.trim(),
        templateId: templateId.trim(),
        publicKey: publicKey.trim(),
      },
      demoMode
    );
    onClose();
  };

  const templateVariables = [
    { name: '{{to_name}}', desc: 'Prénom/Nom du participant destinataire' },
    { name: '{{to_email}}', desc: 'Adresse email du participant' },
    { name: '{{reveal_url}}', desc: 'Lien unique et sécurisé vers la carte à gratter' },
    { name: '{{event_title}}', desc: 'Titre du Secret Santa' },
    { name: '{{budget}}', desc: 'Budget suggéré' },
    { name: '{{custom_message}}', desc: 'Message personnalisé de l\'organisateur' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Configuration EmailJS</h3>
              <p className="text-xs text-rose-100">Envoi sécurisé des emails secrets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Demo Mode Toggle */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Mode Simulation / Test (Sans EmailJS)
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                Simule les envois d&apos;emails avec succès instantané et génère les liens secrets pour tester l&apos;application sans compte EmailJS.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Form Fields */}
          <div className={`space-y-4 ${demoMode ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Service ID
              </label>
              <input
                type="text"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                placeholder="Ex: service_xxxxxx"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Template ID
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="Ex: template_xxxxxx"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Public Key (User ID)
              </label>
              <input
                type="text"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="Ex: _AbCd1234EfGh"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Guide variables template */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {/* Warning callout for "The recipients address is empty" */}
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                ⚠️ Erreur fréquente &quot;The recipients address is empty&quot; :
              </p>
              <p>
                Dans votre dashboard EmailJS &gt; <strong>Email Templates</strong> &gt; Ouvrez votre template :
                Vérifiez impérativement le champ <strong>&quot;To Email&quot;</strong> situé dans l&apos;en-tête des paramètres. Il doit contenir exactement <code className="bg-amber-200/80 dark:bg-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">{'{{to_email}}'}</code> avec les accolades et <strong>ne pas être laissé vide</strong> !
              </p>
            </div>

            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              Variables dynamiques à placer dans votre Template EmailJS :
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {templateVariables.map((v) => (
                <div
                  key={v.name}
                  onClick={() => handleCopy(v.name)}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-rose-400 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {v.name}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {v.desc}
                    </p>
                  </div>
                  <span className="p-1 text-slate-400">
                    {copiedVar === v.name ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
              💡 Vous pouvez aussi définir ces clés dans votre fichier{' '}
              <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">
                .env.local
              </code>{' '}
              pour qu&apos;elles soient chargées automatiquement.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <a
            href="https://dashboard.emailjs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
          >
            Créer un compte EmailJS gratuit
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 shadow-md transition-all cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
