type RhymeWordProps = {
  word: string;
  currentBeat: number;
  isPlaying: boolean;
};

export function RhymeWord({
  word,
  currentBeat,
  isPlaying,
}: RhymeWordProps) {
  const isTargetBeat =
    isPlaying && currentBeat === 4;

  return (
    <div
      className={[
        "flex min-h-48 w-full items-center justify-center rounded-3xl border transition-all duration-150",
        isTargetBeat
          ? "scale-[1.02] border-white bg-white text-black"
          : "border-neutral-800 bg-neutral-900 text-white",
      ].join(" ")}
    >
      <span className="text-5xl font-black tracking-tight sm:text-6xl">
        {word.toUpperCase()}
      </span>
    </div>
  );
}