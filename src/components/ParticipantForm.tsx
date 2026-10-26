'use client';

import React, { useState } from 'react';
import { Participant } from '@/lib/types';
import {
  UserPlus,
  Trash2,
  Users,
  ShieldAlert,
  Sparkles,
  ClipboardPaste,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ParticipantFormProps {
  participants: Participant[];
  onChange: (participants: Participant[]) => void;
  title: string;
  onTitleChange: (val: string) => void;
  budget: string;
  onBudgetChange: (val: string) => void;
  message: string;
  onMessageChange: (val: string) => void;
}

export default function ParticipantForm({
  participants,
  onChange,
  title,
  onTitleChange,
  budget,
  onBudgetChange,
  message,
  onMessageChange,
}: ParticipantFormProps) {
  const [activeExclusionId, setActiveExclusionId] = useState<string | null>(null);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState('');

  const addParticipant = () => {
    const newId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    onChange([
      ...participants,
      {
        id: newId,
        name: '',
        email: '',
        exclusions: [],
      },
    ]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length <= 3) return;
    // Remove participant and remove any reference to this participant in other exclusions
    const updated = participants
      .filter((p) => p.id !== id)
      .map((p) => ({
        ...p,
        exclusions: (p.exclusions || []).filter((exId) => exId !== id),
      }));
    onChange(updated);
  };

  const updateField = (id: string, field: 'name' | 'email', value: string) => {
    onChange(
      participants.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const toggleExclusion = (participantId: string, excludedId: string) => {
    onChange(
      participants.map((p) => {
        if (p.id !== participantId) return p;
        const current = p.exclusions || [];
        const exists = current.includes(excludedId);
        const updatedExclusions = exists
          ? current.filter((id) => id !== excludedId)
          : [...current, excludedId];
        return { ...p, exclusions: updatedExclusions };
      })
    );
  };

  const loadSampleData = () => {
    const samples: Participant[] = [
      { id: 'sample-1', name: 'Alice Dupont', email: 'alice@example.com', exclusions: ['sample-2'] },
      { id: 'sample-2', name: 'Bob Dupont', email: 'bob@example.com', exclusions: ['sample-1'] },
      { id: 'sample-3', name: 'Charlie Martin', email: 'charlie@example.com', exclusions: [] },
      { id: 'sample-4', name: 'Diane Leroy', email: 'diane@example.com', exclusions: [] },
      { id: 'sample-5', name: 'Étienne Moreau', email: 'etienne@example.com', exclusions: [] },
    ];
    onChange(samples);
    onTitleChange('Secret Santa de Noël 🎄');
    onBudgetChange('15 - 20€');
    onMessageChange('Rendez-vous le 24 décembre pour l\'échange de cadeaux !');
  };

  const handleBatchImport = () => {
    if (!batchText.trim()) return;

    const lines = batchText.split('\n');
    const newItems: Participant[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Match "Nom, email" or "Nom; email" or "Nom <email>"
      let name = '';
      let email = '';

      if (trimmed.includes('<') && trimmed.includes('>')) {
        const parts = trimmed.split('<');
        name = parts[0].trim();
        email = parts[1].replace('>', '').trim();
      } else if (trimmed.includes(',')) {
        const parts = trimmed.split(',');
        name = parts[0].trim();
        email = parts.slice(1).join(',').trim();
      } else if (trimmed.includes(';')) {
        const parts = trimmed.split(';');
        name = parts[0].trim();
        email = parts.slice(1).join(';').trim();
      } else {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          email = parts[parts.length - 1];
          name = parts.slice(0, parts.length - 1).join(' ');
        } else {
          name = trimmed;
          email = '';
        }
      }

      if (name) {
        newItems.push({
          id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name,
          email,
          exclusions: [],
        });
      }
    }

    if (newItems.length > 0) {
      onChange([...participants, ...newItems]);
      setBatchText('');
      setShowBatchImport(false);
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="w-full space-y-8">
      {/* Event Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500 text-white text-sm font-bold">1</span>
          Informations de l&apos;événement
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Titre de l&apos;événement
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ex: Secret Santa entre amis, Noël en Famille..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Budget suggéré (optionnel)
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => onBudgetChange(e.target.value)}
              placeholder="Ex: 15€, 20-30€..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Message personnalisé ou consignes (optionnel)
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Ex: Cadeau rigolo ou fait main ! On se retrouve le 24 au soir..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Participants Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500 text-white text-sm font-bold">2</span>
              Liste des participants
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                {participants.length} {participants.length > 1 ? 'inscrits' : 'inscrit'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Minimum 3 participants. Chaque participant recevra son lien secret par email.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Exemples de test
            </button>

            <button
              type="button"
              onClick={() => setShowBatchImport(!showBatchImport)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Importer en masse
            </button>
          </div>
        </div>

        {/* Batch Import Drawer */}
        {showBatchImport && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-start justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Coller une liste (une ligne par personne : &quot;Nom, email@domaine.com&quot;)
              </label>
              <button
                type="button"
                onClick={() => setShowBatchImport(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Fermer
              </button>
            </div>
            <textarea
              rows={4}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="Alice, alice@gmail.com&#10;Bob Dupont, bob@orange.fr&#10;Charlie, charlie@yahoo.com"
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleBatchImport}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Ajouter ces participants
              </button>
            </div>
          </div>
        )}

        {/* Participants Table / List */}
        <div className="space-y-3">
          {participants.map((p, index) => {
            const hasValidEmail = !p.email || isValidEmail(p.email);
            const isExclusionOpen = activeExclusionId === p.id;
            const otherParticipants = participants.filter((other) => other.id !== p.id);
            const exclusionsCount = (p.exclusions || []).length;

            return (
              <div
                key={p.id}
                className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>

                  {/* Name Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => updateField(p.id, 'name', e.target.value)}
                      placeholder="Nom ou Prénom"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="flex-1 relative">
                    <input
                      type="email"
                      value={p.email}
                      onChange={(e) => updateField(p.id, 'email', e.target.value)}
                      placeholder="adresse@email.com"
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 ${
                        !hasValidEmail
                          ? 'border-rose-400 focus:ring-rose-400'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-rose-500'
                      }`}
                    />
                    {!hasValidEmail && (
                      <span className="absolute -bottom-4 left-1 text-[10px] text-rose-500 font-medium">
                        Email invalide
                      </span>
                    )}
                  </div>

                  {/* Exclusions toggle button */}
                  <button
                    type="button"
                    onClick={() => setActiveExclusionId(isExclusionOpen ? null : p.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      exclusionsCount > 0
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Exclure des participants (ex: conjoints)"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>
                      {exclusionsCount > 0
                        ? `${exclusionsCount} exclusion${exclusionsCount > 1 ? 's' : ''}`
                        : 'Exclusions'}
                    </span>
                    {isExclusionOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeParticipant(p.id)}
                    disabled={participants.length <= 3}
                    className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title={
                      participants.length <= 3
                        ? 'Minimum 3 participants requis'
                        : 'Supprimer ce participant'
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Exclusion Drawer for this participant */}
                {isExclusionOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-amber-500" />
                      Sélectionne les personnes que{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {p.name || 'ce participant'}
                      </span>{' '}
                      ne doit <strong>JAMAIS</strong> tirer (ex: son conjoint) :
                    </p>

                    {otherParticipants.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Ajoutez d&apos;autres participants pour définir des exclusions.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {otherParticipants.map((other) => {
                          const isExcluded = (p.exclusions || []).includes(other.id);
                          return (
                            <button
                              key={other.id}
                              type="button"
                              onClick={() => toggleExclusion(p.id, other.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                isExcluded
                                  ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-300 dark:ring-rose-800'
                                  : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-300'
                              }`}
                            >
                              {isExcluded ? '✕ Ne peut pas tirer ' : '+ '}
                              {other.name || 'Sans nom'}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Row Button */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={addParticipant}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-rose-300 hover:border-rose-500 dark:border-rose-900 dark:hover:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-sm font-semibold transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un participant
          </button>

          {participants.length < 3 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <ShieldAlert className="w-4 h-4" />
              <span>Il manque {3 - participants.length} participant(s) pour le tirage</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
