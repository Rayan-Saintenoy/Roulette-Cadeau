'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Eye, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { soundEffects } from './SoundEffects';

interface ScratchCardProps {
  receiverName: string;
  giverName: string;
  eventTitle?: string;
  budget?: string;
  message?: string;
  onRevealed?: () => void;
  initiallyRevealed?: boolean;
}

export default function ScratchCard({
  receiverName,
  giverName,
  eventTitle = 'Secret Santa',
  budget,
  message,
  onRevealed,
  initiallyRevealed = false,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(initiallyRevealed ? 100 : 0);
  const [isFullyRevealed, setIsFullyRevealed] = useState(initiallyRevealed);
  const [isMuted, setIsMuted] = useState(false);
  const lastSoundTime = useRef(0);
  const hasTriggeredReveal = useRef(initiallyRevealed);

  // Trigger celebration effects (confetti + audio)
  const triggerCelebration = useCallback(() => {
    if (hasTriggeredReveal.current) return;
    hasTriggeredReveal.current = true;
    setIsFullyRevealed(true);
    setScratchPercent(100);

    soundEffects.playCelebration();

    // Multistage Confetti burst
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#ef4444', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#fbbf24'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    if (onRevealed) {
      onRevealed();
    }
  }, [onRevealed]);

  // Initialize or re-draw canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // Festive metallic silver-gold foil gradient
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#d1d5db');
    gradient.addColorStop(0.2, '#f3f4f6');
    gradient.addColorStop(0.4, '#e5e7eb');
    gradient.addColorStop(0.6, '#fef08a');
    gradient.addColorStop(0.8, '#fcd34d');
    gradient.addColorStop(1, '#9ca3af');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Add luxury sparkle speckles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      const size = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Border line inside
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, rect.width - 20, rect.height - 20);

    // Scratch instruction text
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ GRATTE ICI AVEC LA SOURIS OU LE DOIGT ✨', rect.width / 2, rect.height / 2 - 12);

    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('🎁 Découvre la personne que tu as tirée ! 🎁', rect.width / 2, rect.height / 2 + 16);
  }, []);

  useEffect(() => {
    if (!initiallyRevealed) {
      initCanvas();
      const handleResize = () => {
        if (!hasTriggeredReveal.current) {
          initCanvas();
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [initCanvas, initiallyRevealed]);

  // Scratch action
  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || hasTriggeredReveal.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Erase coating
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2, false);
    ctx.fill();

    // Sound effect with throttle
    const now = Date.now();
    if (now - lastSoundTime.current > 70) {
      soundEffects.playScratch();
      lastSoundTime.current = now;
    }

    // Check progress
    checkScratchPercentage();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || hasTriggeredReveal.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sample a 50x50 grid of pixels to test opacity
    const sampleWidth = 40;
    const sampleHeight = 25;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const totalPixels = pixels.length / 4;
    let transparentCount = 0;

    const step = Math.max(1, Math.floor(totalPixels / (sampleWidth * sampleHeight)));
    let sampledCount = 0;

    for (let i = 3; i < pixels.length; i += step * 4) {
      sampledCount++;
      if (pixels[i] < 128) {
        transparentCount++;
      }
    }

    const percent = Math.min(100, Math.round((transparentCount / sampledCount) * 100));
    setScratchPercent(percent);

    // If more than 40% is scratched, reveal completely!
    if (percent >= 40) {
      triggerCelebration();
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScratching(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScratching) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsScratching(true);
    if (e.touches.length > 0) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isScratching) return;
    if (e.touches.length > 0) {
      // Prevent scrolling while scratching
      e.preventDefault();
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
  };

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundEffects.setMuted(nextState);
  };

  const handleManualReveal = () => {
    triggerCelebration();
  };

  const handleReset = () => {
    hasTriggeredReveal.current = false;
    setIsFullyRevealed(false);
    setScratchPercent(0);
    setTimeout(() => {
      initCanvas();
    }, 50);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Sound & action buttons bar */}
      <div className="w-full flex items-center justify-between px-2 mb-3 text-sm">
        <button
          onClick={toggleSound}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors text-xs font-medium cursor-pointer"
          title={isMuted ? 'Activer le son' : 'Désactiver le son'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
              <span>Son coupé</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Effets sonores actifs</span>
            </>
          )}
        </button>

        {isFullyRevealed && (
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-gratter</span>
          </button>
        )}
      </div>

      {/* Main Scratch Card Box */}
      <div
        ref={containerRef}
        className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-400/80 bg-gradient-to-br from-red-700 via-rose-800 to-amber-900 select-none"
      >
        {/* Underneath Secret Layer (Revealed Name & Details) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-gradient-to-b from-rose-900 via-red-900 to-amber-950">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            C&apos;est officiel !
          </div>

          <p className="text-xs sm:text-sm text-rose-200 mb-1 font-medium">
            {giverName}, tu dois offrir un cadeau à :
          </p>

          <div className="my-2 px-6 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 tracking-tight drop-shadow-md">
              {receiverName}
            </h2>
          </div>

          {budget && (
            <p className="mt-2 text-xs sm:text-sm font-semibold text-amber-300">
              💰 Budget conseillé : <span className="underline decoration-amber-400">{budget}</span>
            </p>
          )}

          {message && (
            <p className="mt-2 text-xs text-rose-200/90 italic max-w-sm line-clamp-2">
              &ldquo;{message}&rdquo;
            </p>
          )}

          <p className="text-[11px] text-rose-300/80 mt-2">
            🤫 Chuuut ! Garde le secret jusqu&apos;au grand jour !
          </p>
        </div>

        {/* Scratch Canvas Overlay */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`absolute inset-0 z-10 w-full h-full cursor-pointer transition-opacity duration-700 ${
            isFullyRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Progress & Quick Reveal Action */}
      {!isFullyRevealed ? (
        <div className="w-full mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-150"
                style={{ width: `${scratchPercent}%` }}
              />
            </div>
            <span>{scratchPercent}% gratté</span>
          </div>

          <button
            onClick={handleManualReveal}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Tout révéler d&apos;un clic</span>
          </button>
        </div>
      ) : (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm text-center font-medium animate-fade-in">
          🎉 Félicitations ! Tu as découvert ton tirage. Ne révèle rien aux autres participants !
        </div>
      )}
    </div>
  );
}
