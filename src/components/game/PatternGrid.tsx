import type { RhymeScheme } from "@/types/game";

type PatternGridProps = {
  words: string[];
  currentBar: number;
  currentBeat: number;
  isPlaying: boolean;
  rhymeScheme: RhymeScheme;
};

export function PatternGrid({
  words,
  currentBar,
  currentBeat,
  isPlaying,
  rhymeScheme,
}: PatternGridProps) {
  const pattern = rhymeScheme.split("");

  const blockStart =
    Math.floor((currentBar - 1) / 4) * 4;

  const currentGlobalCell =
    (currentBar - 1) * 4 +
    (currentBeat - 1);

  const rows = Array.from(
    { length: 4 },
    (_, rowIndex) => {
      const absoluteBarIndex =
        blockStart + rowIndex;

      return {
        barNumber:
          absoluteBarIndex + 1,

        word:
          words[
            absoluteBarIndex
          ] ?? "",

        rhyme:
          pattern[
            rowIndex %
              pattern.length
          ] ?? "A",
      };
    },
  );

  return (
    <div className="w-full space-y-2">
      {rows.map(
        (
          {
            barNumber,
            word,
            rhyme,
          },
          rowIndex,
        ) => (
          <div
            key={barNumber}
            className="grid grid-cols-[32px_repeat(4,minmax(0,1fr))] gap-2"
          >
            <div className="flex items-center justify-center text-xs font-bold text-neutral-600">
              {rhyme}
            </div>

            {Array.from(
              { length: 4 },
              (_, beatIndex) => {
                const absoluteCell =
                  (barNumber - 1) *
                    4 +
                  beatIndex;

                const isCurrent =
                  isPlaying &&
                  absoluteCell ===
                    currentGlobalCell;

                const isPast =
                  absoluteCell <
                  currentGlobalCell;

                const showWord =
                  beatIndex === 3;

                return (
                  <div
                    key={`${barNumber}-${beatIndex}`}
                    className={[
                      "relative flex h-20 items-center justify-center rounded-xl border transition-all duration-150 sm:h-24",

                      isPast
                        ? "border-neutral-700 bg-neutral-800 text-neutral-500"
                        : "",

                      isCurrent
                        ? "border-white bg-neutral-100 text-black"
                        : "",

                      !isPast &&
                      !isCurrent
                        ? "border-neutral-800 bg-neutral-950 text-neutral-200"
                        : "",
                    ].join(" ")}
                  >
                    {isCurrent && (
                      <div className="absolute top-3 h-3 w-3 animate-bounce rounded-full bg-black" />
                    )}

                    {showWord && word && (
                      <span
                        className={[
                          "px-2 text-center text-base font-bold uppercase tracking-tight sm:text-xl",

                          isPast
                            ? "text-neutral-500"
                            : "",

                          isCurrent
                            ? "mt-5 text-black"
                            : "",
                        ].join(" ")}
                      >
                        {word}
                      </span>
                    )}
                  </div>
                );
              },
            )}
          </div>
        ),
      )}
    </div>
  );
}