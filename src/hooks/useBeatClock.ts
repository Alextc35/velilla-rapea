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

  /*
   * AudioContext principal.
   *
   * Lo reutilizamos durante toda la vida
   * del componente.
   */
  const audioContextRef =
    useRef<AudioContext | null>(null);

  /*
   * Audio ya descargado y decodificado.
   *
   * Así evitamos volver a hacer fetch
   * cada vez que pulsamos Play.
   */
  const audioBufferRef =
    useRef<AudioBuffer | null>(null);

  /*
   * Guardamos qué URL corresponde al buffer
   * actualmente cargado.
   *
   * Esto será útil cuando tengamos
   * selector de beats.
   */
  const loadedAudioUrlRef =
    useRef<string | null>(null);

  /*
   * AudioBufferSourceNode que está
   * reproduciendo actualmente.
   *
   * Cada reproducción necesita uno nuevo.
   */
  const sourceRef =
    useRef<AudioBufferSourceNode | null>(null);

  /*
   * Momento exacto del AudioContext
   * en el que comienza el beat.
   */
  const startedAtRef =
    useRef<number | null>(null);

  /*
   * requestAnimationFrame utilizado
   * para actualizar la interfaz.
   */
  const animationFrameRef =
    useRef<number | null>(null);

  /**
   * Detiene el loop visual.
   */
  const stopAnimationFrame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(
        animationFrameRef.current,
      );

      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Detiene únicamente el source de audio
   * que esté sonando.
   */
  const stopAudioSource = useCallback(() => {
    if (!sourceRef.current) {
      return;
    }

    try {
      sourceRef.current.stop();
    } catch {
      /*
       * Puede ocurrir si el source
       * ya se había detenido.
       */
    }

    sourceRef.current.disconnect();
    sourceRef.current = null;
  }, []);

  /**
   * Detiene completamente la reproducción
   * y reinicia el reloj del juego.
   */
  const stop = useCallback(() => {
    stopAnimationFrame();
    stopAudioSource();

    startedAtRef.current = null;

    setCurrentBeat(1);
    setCurrentBar(1);
    setIsPlaying(false);
  }, [
    stopAnimationFrame,
    stopAudioSource,
  ]);

  /**
   * Arranca el reloj visual.
   *
   * IMPORTANTE:
   * requestAnimationFrame NO es nuestro
   * reloj musical.
   *
   * El reloj real siempre es:
   *
   * AudioContext.currentTime
   *
   * requestAnimationFrame simplemente
   * consulta ese reloj y actualiza React.
   */
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
       * El audio se programa ligeramente
       * en el futuro.
       *
       * Mientras todavía no haya llegado
       * startTime, esperamos.
       */
      if (elapsedSeconds < 0) {
        animationFrameRef.current =
          requestAnimationFrame(update);

        return;
      }

      /*
       * Ejemplo a 4 beats por compás:
       *
       * absoluteBeat = 0 → beat 1, compás 1
       * absoluteBeat = 1 → beat 2, compás 1
       * absoluteBeat = 2 → beat 3, compás 1
       * absoluteBeat = 3 → beat 4, compás 1
       * absoluteBeat = 4 → beat 1, compás 2
       */
      const absoluteBeat =
        Math.floor(
          elapsedSeconds /
            secondsPerBeat,
        );

      const beat =
        (absoluteBeat %
          beatsPerBar) +
        1;

      const bar =
        Math.floor(
          absoluteBeat /
            beatsPerBar,
        ) + 1;

      /*
       * Evitamos actualizaciones de estado
       * innecesarias si seguimos dentro
       * del mismo beat.
       */
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
        requestAnimationFrame(
          update,
        );
    };

    update();
  }, [
    bpm,
    beatsPerBar,
  ]);

  /**
   * Prepara y reproduce el audio.
   */
  const play = useCallback(async () => {
    if (isPlaying || isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      /*
       * Creamos el AudioContext únicamente
       * cuando el usuario intenta reproducir.
       *
       * Esto evita problemas con las políticas
       * de autoplay de los navegadores.
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
       * automáticamente AudioContext.
       */
      if (
        audioContext.state ===
        "suspended"
      ) {
        await audioContext.resume();
      }

      /*
       * Si cambia audioUrl en el futuro,
       * por ejemplo mediante un selector
       * de beats, invalidamos el buffer.
       */
      if (
        loadedAudioUrlRef.current !==
        audioUrl
      ) {
        audioBufferRef.current = null;
        loadedAudioUrlRef.current =
          null;
      }

      /*
       * Descargamos y decodificamos
       * el beat únicamente si hace falta.
       */
      if (!audioBufferRef.current) {
        audioBufferRef.current =
          await loadAudioBuffer(
            audioContext,
            audioUrl,
          );

        loadedAudioUrlRef.current =
          audioUrl;
      }

      /*
       * Cada AudioBufferSourceNode
       * solamente puede iniciarse una vez,
       * por lo que creamos uno nuevo
       * para cada partida.
       */
      const source =
        audioContext.createBufferSource();

      source.buffer =
        audioBufferRef.current;

      /*
       * Por ahora hacemos loop infinito.
       *
       * Cuando implementemos el final
       * automático de partida, podremos
       * detenerlo nosotros mismos.
       */
      source.loop = true;

      source.connect(
        audioContext.destination,
      );

      sourceRef.current = source;

      /*
       * Programamos el inicio 50 ms
       * en el futuro.
       *
       * El audio y nuestro reloj utilizan
       * exactamente el mismo startTime.
       */
      const startTime =
        audioContext.currentTime +
        0.05;

      startedAtRef.current =
        startTime;

      /*
       * Reiniciamos el estado visual.
       */
      setCurrentBeat(1);
      setCurrentBar(1);

      /*
       * Programamos el audio.
       */
      source.start(startTime);

      setIsPlaying(true);

      /*
       * Comenzamos a consultar el reloj
       * del AudioContext.
       */
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

  /**
   * Función cómoda por si queremos
   * controlar Play/Stop desde un único botón.
   */
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

  /**
   * Limpieza cuando Game desaparece
   * del árbol de React.
   */
  useEffect(() => {
    return () => {
      stopAnimationFrame();
      stopAudioSource();

      startedAtRef.current = null;

      if (audioContextRef.current) {
        void audioContextRef.current.close();

        audioContextRef.current =
          null;
      }
    };
  }, [
    stopAnimationFrame,
    stopAudioSource,
  ]);

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