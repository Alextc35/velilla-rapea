type RhymeWordProps = {
  currentWord: string;
  nextWord: string;
  currentBeat: number;
  isPlaying: boolean;
};

export function RhymeWord({
  currentWord,
  nextWord,
  currentBeat,
  isPlaying,
}: RhymeWordProps) {
  const isTargetBeat =
    isPlaying && currentBeat === 4;

  return (
    <div className="w-full space-y-4">
      <div
        className={[
          "flex min-h-48 w-full flex-col items-center justify-center rounded-3xl border transition-all duration-150",
          isTargetBeat
            ? "scale-[1.02] border-white bg-white text-black"
            : "border-neutral-800 bg-neutral-900 text-white",
        ].join(" ")}
      >
        <span className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] opacity-60">
          Ahora
        </span>

        <span className="text-5xl font-black tracking-tight sm:text-6xl">
          {currentWord.toUpperCase()}
        </span>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Siguiente
        </p>

        <p className="mt-2 text-2xl font-bold text-neutral-300">
          {nextWord.toUpperCase()}
        </p>
      </div>
    </div>
  );
}