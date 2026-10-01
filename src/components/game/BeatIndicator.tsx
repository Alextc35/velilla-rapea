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
  const beats =
    Array.from(
      {
        length:
          beatsPerBar,
      },
      (_, index) =>
        index + 1,
    );

  return (
    <div className="flex items-center justify-center gap-4">
      {beats.map(
        (beat) => {
          const isActive =
            isPlaying &&
            beat ===
              currentBeat;

          return (
            <div
              key={beat}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={[
                  "h-4 w-4 rounded-full border transition-all duration-100",

                  isActive
                    ? "scale-125 border-white bg-white"
                    : "border-neutral-700 bg-neutral-900",
                ].join(" ")}
              />

              <span
                className={[
                  "font-mono text-xs",

                  isActive
                    ? "text-white"
                    : "text-neutral-600",
                ].join(" ")}
              >
                {beat}
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}