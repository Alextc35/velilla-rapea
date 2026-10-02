"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseBeatClockOptions = {
  bpm: number;
  audioUrl: string;
  beatsPerBar?: number;
  numberOfBars?: number;
};

export function useBeatClock({
  bpm,
  audioUrl,
  beatsPerBar = 4,
  numberOfBars = 32,
}: UseBeatClockOptions) {
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentBar, setCurrentBar] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedAudioUrlRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playRequestRef = useRef(0);

  const stopAnimationFrame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    playRequestRef.current += 1;
    stopAnimationFrame();
    startedAtRef.current = null;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // La pista puede no haber terminado de cargar sus metadatos.
      }
    }

    setCurrentBeat(1);
    setCurrentBar(1);
    setIsPlaying(false);
    setIsLoading(false);
    setHasCompleted(false);
    setError(null);
  }, [stopAnimationFrame]);

  const play = useCallback(async (): Promise<boolean> => {
    if (isPlaying || isLoading) return false;

    const requestId = playRequestRef.current + 1;
    playRequestRef.current = requestId;
    setIsLoading(true);
    setError(null);
    setHasCompleted(false);

    try {
      let audio = audioRef.current;

      if (!audio || loadedAudioUrlRef.current !== audioUrl) {
        audio?.pause();
        audio = new Audio(audioUrl);
        audio.preload = "none";
        audio.loop = true;
        audioRef.current = audio;
        loadedAudioUrlRef.current = audioUrl;
      }

      audio.loop = true;
      try {
        audio.currentTime = 0;
      } catch {
        // El navegador inicia desde el principio cuando aún no conoce la duración.
      }

      await audio.play();
      if (playRequestRef.current !== requestId) {
        audio.pause();
        return false;
      }

      const startedAt = performance.now();
      startedAtRef.current = startedAt;
      setCurrentBeat(1);
      setCurrentBar(1);
      setIsPlaying(true);

      const tick = (now: number) => {
        const actualStart = startedAtRef.current;
        if (actualStart === null) return;

        const elapsed = Math.max(0, (now - actualStart) / 1000);
        const absoluteBeat = Math.floor((elapsed * bpm) / 60);
        const totalBeats = numberOfBars * beatsPerBar;

        if (absoluteBeat >= totalBeats) {
          stopAnimationFrame();
          startedAtRef.current = null;
          audio?.pause();
          try {
            audio.currentTime = 0;
          } catch {
            // Ignoramos el reinicio si el navegador aún no ha leído la duración.
          }
          setCurrentBeat(beatsPerBar);
          setCurrentBar(numberOfBars);
          setIsPlaying(false);
          setHasCompleted(true);
          return;
        }

        setCurrentBeat((absoluteBeat % beatsPerBar) + 1);
        setCurrentBar(Math.floor(absoluteBeat / beatsPerBar) + 1);
        animationFrameRef.current = requestAnimationFrame(tick);
      };

      animationFrameRef.current = requestAnimationFrame(tick);
      return true;
    } catch {
      if (playRequestRef.current === requestId) {
        setError("No se ha podido reproducir esta base. Comprueba que el archivo contiene audio compatible.");
        setIsPlaying(false);
      }
      return false;
    } finally {
      if (playRequestRef.current === requestId) setIsLoading(false);
    }
  }, [audioUrl, beatsPerBar, bpm, isLoading, isPlaying, numberOfBars, stopAnimationFrame]);

  useEffect(() => {
    return () => {
      playRequestRef.current += 1;
      stopAnimationFrame();
      startedAtRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [stopAnimationFrame]);

  return {
    currentBeat,
    currentBar,
    isPlaying,
    isLoading,
    hasCompleted,
    error,
    play,
    stop,
  };
}
