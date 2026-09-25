type BeatIndicatorProps = {
  currentBeat: number;
  isPlaying: boolean;
  beatsPerBar?: number;
};

export function BeatIndicator({
  currentBeat,
  isPlaying,
  beatsPerBar = 4,
}: BeatIndicatorProps) {
  const beats = Array.from(
    { length: beatsPerBar },
    (_, index) => index + 1,
  );

  return (
    <div className="grid w-full grid-cols-4 gap-3">
      {beats.map((beat) => {
        const isActive = isPlaying && beat === currentBeat;

        return (
          <div
            key={beat}
            className={[
              "flex aspect-square items-center justify-center rounded-2xl border text-2xl font-bold transition-all duration-150 sm:aspect-auto sm:h-24",
              isActive
                ? "scale-105 border-white bg-white text-black"
                : "border-neutral-800 bg-neutral-900 text-neutral-500",
            ].join(" ")}
          >
            {beat}
          </div>
        );
      })}
    </div>
  );
}