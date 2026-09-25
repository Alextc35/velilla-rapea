"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { loadAudioBuffer } from "@/lib/audio";

type UseBeatClockOptions = {
  bpm: number;
  audioUrl: string;
  beatsPerBar?: number;
};

export function useBeatClock({
  bpm,
  audioUrl,
  beatsPerBar = 4,
}: UseBeatClockOptions) {
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentBar, setCurrentBar] = useState(1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const audioBufferRef =
    useRef<AudioBuffer | null>(null);

  const sourceRef =
    useRef<AudioBufferSourceNode | null>(null);

  const startedAtRef =
    useRef<number | null>(null);

  const animationFrameRef =
    useRef<number | null>(null);

  const stopAnimationFrame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(
        animationFrameRef.current,
      );

      animationFrameRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    stopAnimationFrame();

    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // El AudioBufferSourceNode podría estar ya detenido.
      }

      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    startedAtRef.current = null;

    setCurrentBeat(1);
    setCurrentBar(1);
    setIsPlaying(false);
  }, [stopAnimationFrame]);

  const startClock = useCallback(() => {
    const audioContext =
      audioContextRef.current;

    const startedAt =
      startedAtRef.current;

    if (
      !audioContext ||
      startedAt === null
    ) {
      return;
    }

    const secondsPerBeat =
      60 / bpm;

    const update = () => {
      const elapsedSeconds =
        audioContext.currentTime -
        startedAt;

      /*
       * El audio se programa unos milisegundos
       * en el futuro.
       *
       * Hasta que llegue realmente ese momento,
       * consideramos que seguimos en el primer beat.
       */
      if (elapsedSeconds < 0) {
        animationFrameRef.current =
          requestAnimationFrame(update);

        return;
      }

      /*
       * Número absoluto de beats transcurridos:
       *
       * 0 → primer beat
       * 1 → segundo beat
       * 2 → tercer beat
       * 3 → cuarto beat
       * 4 → primer beat del segundo compás
       */
      const absoluteBeat = Math.floor(
        elapsedSeconds / secondsPerBeat,
      );

      /*
       * Convertimos el beat absoluto
       * a un valor entre 1 y beatsPerBar.
       *
       * Para 4/4:
       *
       * 0 → 1
       * 1 → 2
       * 2 → 3
       * 3 → 4
       * 4 → 1
       */
      const beat =
        (absoluteBeat % beatsPerBar) + 1;

      /*
       * Calculamos el número de compás.
       *
       * Beats 0-3   → compás 1
       * Beats 4-7   → compás 2
       * Beats 8-11  → compás 3
       */
      const bar =
        Math.floor(
          absoluteBeat / beatsPerBar,
        ) + 1;

      setCurrentBeat(
        (previousBeat) =>
          previousBeat === beat
            ? previousBeat
            : beat,
      );

      setCurrentBar(
        (previousBar) =>
          previousBar === bar
            ? previousBar
            : bar,
      );

      animationFrameRef.current =
        requestAnimationFrame(update);
    };

    update();
  }, [bpm, beatsPerBar]);

  const play = useCallback(async () => {
    if (isPlaying || isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      /*
       * AudioContext solo puede crearse
       * en el navegador.
       *
       * Como este hook usa "use client",
       * estamos seguros de ejecutarlo
       * del lado del cliente.
       */
      let audioContext =
        audioContextRef.current;

      if (!audioContext) {
        audioContext =
          new AudioContext();

        audioContextRef.current =
          audioContext;
      }

      /*
       * Algunos navegadores suspenden
       * AudioContext hasta que existe
       * una interacción del usuario.
       */
      if (
        audioContext.state === "suspended"
      ) {
        await audioContext.resume();
      }

      /*
       * Solo cargamos y decodificamos
       * el archivo una vez.
       */
      if (!audioBufferRef.current) {
        audioBufferRef.current =
          await loadAudioBuffer(
            audioContext,
            audioUrl,
          );
      }

      /*
       * AudioBufferSourceNode solo puede
       * reproducirse una vez.
       *
       * Por ello debemos crear uno nuevo
       * cada vez que pulsamos Play.
       */
      const source =
        audioContext.createBufferSource();

      source.buffer =
        audioBufferRef.current;

      source.loop = true;

      source.connect(
        audioContext.destination,
      );

      sourceRef.current = source;

      /*
       * Programamos el comienzo ligeramente
       * en el futuro.
       *
       * Esto permite que tanto el navegador
       * como nuestro reloj compartan
       * exactamente la misma referencia
       * temporal.
       */
      const startTime =
        audioContext.currentTime + 0.05;

      startedAtRef.current =
        startTime;

      setCurrentBeat(1);
      setCurrentBar(1);
      setIsPlaying(true);

      source.start(startTime);

      startClock();
    } catch (error) {
      console.error(
        "Error iniciando el motor de audio:",
        error,
      );

      stop();
    } finally {
      setIsLoading(false);
    }
  }, [
    audioUrl,
    isLoading,
    isPlaying,
    startClock,
    stop,
  ]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }

    void play();
  }, [
    isPlaying,
    play,
    stop,
  ]);

  /*
   * Limpieza cuando el componente que utiliza
   * el hook desaparece.
   */
  useEffect(() => {
    return () => {
      stopAnimationFrame();

      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // Ya estaba detenido.
        }

        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (audioContextRef.current) {
        void audioContextRef.current.close();

        audioContextRef.current = null;
      }
    };
  }, [stopAnimationFrame]);

  return {
    currentBeat,
    currentBar,

    isPlaying,
    isLoading,

    play,
    stop,
    toggle,
  };
}