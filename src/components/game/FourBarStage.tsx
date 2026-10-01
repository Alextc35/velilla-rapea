import type {
  RhymeScheme,
} from "@/types/game";

type FourBarStageProps = {
  words: string[];
  currentBar: number;
  currentBeat: number;
  isPlaying: boolean;
  rhymeScheme: RhymeScheme;
};

export function FourBarStage({
  words,
  currentBar,
  currentBeat,
  isPlaying,
  rhymeScheme,
}: FourBarStageProps) {
  const pattern =
    rhymeScheme.split("");

  /*
   * currentBar empieza en 1.
   *
   * Barras 1-4  -> groupStart = 0
   * Barras 5-8  -> groupStart = 4
   * Barras 9-12 -> groupStart = 8
   */
  const groupStart =
    Math.floor(
      (currentBar - 1) / 4,
    ) * 4;

  const visibleBars =
    Array.from(
      { length: 4 },
      (_, index) => {
        const absoluteIndex =
          groupStart + index;

        return {
          barNumber:
            absoluteIndex + 1,

          word:
            words[
              absoluteIndex
            ] ?? "—",

          rhyme:
            pattern[
              index %
                pattern.length
            ] ?? "A",
        };
      },
    );

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
      {visibleBars.map(
        (
          {
            barNumber,
            word,
            rhyme,
          },
          index,
        ) => {
          const isCurrent =
            barNumber ===
            currentBar;

          const isCompleted =
            barNumber <
            currentBar;

          return (
            <div
              key={barNumber}
              className={[
                "relative flex min-h-28 items-center gap-5 border-b border-neutral-800 px-5 transition-all duration-200 last:border-b-0 sm:px-7",

                isCurrent &&
                isPlaying
                  ? "bg-white text-black"
                  : "",

                !isCurrent &&
                !isCompleted
                  ? "bg-neutral-950 text-white"
                  : "",

                isCompleted
                  ? "bg-neutral-900/50 text-neutral-600"
                  : "",
              ].join(" ")}
            >
              {/* Rima A/B */}
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black",

                  isCurrent &&
                  isPlaying
                    ? "border-black/20 bg-black text-white"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400",
                ].join(" ")}
              >
                {rhyme}
              </div>

              {/* Número de barra */}
              <div
                className={[
                  "w-8 shrink-0 font-mono text-xs",

                  isCurrent &&
                  isPlaying
                    ? "text-neutral-500"
                    : "text-neutral-600",
                ].join(" ")}
              >
                {String(
                  barNumber,
                ).padStart(
                  2,
                  "0",
                )}
              </div>

              {/* Palabra */}
              <div className="min-w-0 flex-1 text-left">
                <span
                  className={[
                    "block truncate text-3xl font-black uppercase tracking-tight sm:text-4xl",

                    !isCurrent &&
                    !isCompleted
                      ? "text-neutral-200"
                      : "",

                    isCompleted
                      ? "text-neutral-600 line-through decoration-neutral-700"
                      : "",
                  ].join(" ")}
                >
                  {word}
                </span>
              </div>

              {/* Estado */}
              <div className="w-10 shrink-0 text-right">
                {isCompleted && (
                  <span className="text-lg text-neutral-600">
                    ✓
                  </span>
                )}

                {isCurrent &&
                  isPlaying && (
                    <span className="font-mono text-sm font-bold">
                      {currentBeat}
                    </span>
                  )}
              </div>

              {/* Indicador lateral */}
              {isCurrent &&
                isPlaying && (
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-black" />
                )}
            </div>
          );
        },
      )}
    </div>
  );
}