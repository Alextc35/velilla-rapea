"use client";

import { useMemo } from "react";

import { useBeatClock } from "@/hooks/useBeatClock";
import { createRhymeSequence } from "@/lib/rhymes";

import { BeatIndicator } from "./BeatIndicator";
import { RhymeWord } from "./RhymeWord";

const BPM = 90;

export function Game() {
  const words = useMemo(
    () => createRhymeSequence(),
    [],
  );

  const {
    currentBeat,
    currentBar,
    isPlaying,
    isLoading,
    toggle,
  } = useBeatClock({
    bpm: BPM,
    audioUrl: "/beats/beat-90bpm.mp3",
  });

  const wordIndex =
    (currentBar - 1) % words.length;

  const currentWord =
    words[wordIndex] ?? "casa";

  return (
    <section className="flex w-full max-w-3xl flex-col items-center gap-10 text-center">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
          Beta 0.0.1
        </p>

        <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
          VelillaRapea
        </h1>

        <p className="text-neutral-400">
          Entrena tu freestyle. Sigue el ritmo. Encuentra la rima.
        </p>
      </header>

      <RhymeWord
        word={currentWord}
        currentBeat={currentBeat}
        isPlaying={isPlaying}
      />

      <BeatIndicator
        currentBeat={currentBeat}
        isPlaying={isPlaying}
      />

      <div className="flex gap-6 text-sm text-neutral-400">
        <span>
          Compás{" "}
          <strong className="text-white">
            {currentBar}
          </strong>
        </span>

        <span>
          Beat{" "}
          <strong className="text-white">
            {currentBeat}/4
          </strong>
        </span>

        <span>
          <strong className="text-white">
            {BPM}
          </strong>{" "}
          BPM
        </span>
      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={toggle}
        className="min-w-44 rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition hover:bg-neutral-200 active:scale-95 disabled:cursor-wait disabled:opacity-50"
      >
        {isLoading
          ? "Cargando..."
          : isPlaying
            ? "Parar"
            : "Empezar"}
      </button>

      <p className="text-sm text-neutral-500">
        {isPlaying
          ? "Improvisa y haz caer la palabra en el cuarto tiempo."
          : "Pulsa Empezar cuando estés preparado."}
      </p>
    </section>
  );
}