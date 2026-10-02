import type { RhymeScheme } from "@/types/game";

type PatternGridProps = {
  words: string[];
  currentBar: number;
  currentBeat: number;
  isPlaying: boolean;
  hasCompleted: boolean;
  rhymeScheme: RhymeScheme;
};

export function PatternGrid({
  words,
  currentBar,
  currentBeat,
  isPlaying,
  hasCompleted,
  rhymeScheme,
}: PatternGridProps) {
  const pattern = rhymeScheme === "FREE" ? ["✳", "✳", "✳", "✳"] : rhymeScheme.split("");
  const blockStart = Math.floor((currentBar - 1) / 4) * 4;

  return (
    <div className="pattern-grid" aria-label="Patrón de cuatro barras">
      {Array.from({ length: 4 }, (_, rowIndex) => {
        const barIndex = blockStart + rowIndex;
        const barNumber = barIndex + 1;
        const isCurrentBar = barNumber === currentBar;
        const isBarComplete = hasCompleted || barNumber < currentBar;
        const letter = pattern[rowIndex] ?? "A";
        const word = words[barIndex] ?? "";

        return (
          <div
            key={barNumber}
            className={[
              "bar-row",
              isBarComplete ? "bar-row--past" : "",
              isCurrentBar && isPlaying ? "bar-row--current" : "",
            ].filter(Boolean).join(" ")}
          >
            <div className="bar-row__label">
              <span className={rhymeScheme === "FREE" ? "rhyme-mark rhyme-mark--free" : "rhyme-mark"}>
                {letter}
              </span>
              <span className="bar-row__number">{String(barNumber).padStart(2, "0")}</span>
            </div>
            <div className="bar-row__beats">
              {Array.from({ length: 4 }, (_, beatIndex) => {
                const isCurrentBeat = isCurrentBar && currentBeat === beatIndex + 1 && isPlaying;
                const isPastBeat = isBarComplete || (isCurrentBar && currentBeat > beatIndex + 1);
                const showWord = beatIndex === 3 && word;

                return (
                  <div
                    key={beatIndex}
                    className={[
                      "beat-cell",
                      isPastBeat ? "beat-cell--past" : "",
                      isCurrentBeat ? "beat-cell--current" : "",
                    ].filter(Boolean).join(" ")}
                    aria-current={isCurrentBeat ? "step" : undefined}
                  >
                    <span className="beat-cell__count">{beatIndex + 1}</span>
                    {showWord && <span className="beat-cell__word">{word}</span>}
                    {isCurrentBeat && <span className="beat-cell__pulse" aria-hidden="true" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
