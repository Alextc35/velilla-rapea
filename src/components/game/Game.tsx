"use client";

import { useState } from "react";

import { useBeatClock } from "@/hooks/useBeatClock";
import { useGameSession } from "@/hooks/useGameSession";

import type {
  GameConfig,
  RhymeScheme,
} from "@/types/game";

import { PatternGrid } from "./PatternGrid";
import { RhymeSchemeSelector } from "./RhymeSchemeSelector";

const BPM = 90;
const NUMBER_OF_BARS = 32;
const BEATS_PER_BAR = 4;
const AUDIO_URL = "/beats/beat-90bpm.mp3";

export function Game() {
  const [rhymeScheme, setRhymeScheme] =
    useState<RhymeScheme>("AABB");

  const gameConfig: GameConfig = {
    bpm: BPM,
    beatsPerBar: BEATS_PER_BAR,
    numberOfBars: NUMBER_OF_BARS,
    rhymeScheme,
    audioUrl: AUDIO_URL,
  };

  const {
    currentBeat,
    currentBar,
    isPlaying,
    isLoading,
    play,
    stop,
  } = useBeatClock({
    bpm: gameConfig.bpm,
    beatsPerBar: gameConfig.beatsPerBar,
    audioUrl: gameConfig.audioUrl,
  });

  const {
    session,
    prepareSession,
    stopSession,
  } = useGameSession(gameConfig);

  const startGame = async () => {
    prepareSession();
    await play();
  };

  const stopGame = () => {
    stop();
    stopSession();
  };

  const handleToggle = () => {
    if (isPlaying) {
      stopGame();
      return;
    }

    void startGame();
  };

  return (
    <section className="flex w-full max-w-6xl flex-col items-center gap-8 text-center">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
          Beta 0.0.2
        </p>

        <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
          VelillaRapea
        </h1>

        <p className="text-neutral-400">
          Entrena tu freestyle. Sigue el ritmo. Encuentra la rima.
        </p>
      </header>

      <PatternGrid
        words={session.words}
        currentBar={currentBar}
        currentBeat={currentBeat}
        isPlaying={isPlaying}
        rhymeScheme={rhymeScheme}
      />

      <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        <span>
          {gameConfig.bpm} BPM
        </span>

        <span>·</span>

        <span>
          {rhymeScheme}
        </span>

        <span>·</span>

        <span>
          {gameConfig.numberOfBars} barras
        </span>
      </div>

      <RhymeSchemeSelector
        value={rhymeScheme}
        disabled={isPlaying || isLoading}
        onChange={setRhymeScheme}
      />

      <button
        type="button"
        disabled={isLoading}
        onClick={handleToggle}
        className="min-w-44 rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition hover:bg-neutral-200 active:scale-95 disabled:cursor-wait disabled:opacity-50"
      >
        {isLoading
          ? "Cargando..."
          : isPlaying
            ? "Parar"
            : "Empezar"}
      </button>

      <div className="space-y-1 text-sm text-neutral-500">
        <p>
          Estado:{" "}
          <strong className="text-neutral-300">
            {session.status}
          </strong>
        </p>

        <p>
          {isPlaying
            ? `Barra ${currentBar} · Beat ${currentBeat}/${gameConfig.beatsPerBar}`
            : "Elige un esquema y pulsa Empezar."}
        </p>
      </div>
    </section>
  );
}