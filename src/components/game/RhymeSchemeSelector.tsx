import type { RhymeScheme } from "@/types/game";

type RhymeSchemeSelectorProps = {
  value: RhymeScheme;
  disabled?: boolean;
  onChange: (scheme: RhymeScheme) => void;
};

const SCHEMES: {
  value: RhymeScheme;
  label: string;
  detail: string;
  preview: string[];
}[] = [
  { value: "AAAA", label: "Monorrima", detail: "Una rima, cuatro barras", preview: ["A", "A", "A", "A"] },
  { value: "ABAB", label: "Alternada", detail: "Cruza dos rimas", preview: ["A", "B", "A", "B"] },
  { value: "ABBA", label: "En espejo", detail: "La primera cierra el patrón", preview: ["A", "B", "B", "A"] },
  { value: "FREE", label: "Libre", detail: "Palabras para abrir camino", preview: ["✳", "✳", "✳", "✳"] },
];

export function RhymeSchemeSelector({
  value,
  disabled = false,
  onChange,
}: RhymeSchemeSelectorProps) {
  return (
    <fieldset className="format-fieldset" disabled={disabled}>
      <legend className="field-label">Formato de rima</legend>
      <div className="format-grid">
        {SCHEMES.map((scheme) => {
          const isSelected = scheme.value === value;

          return (
            <button
              key={scheme.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(scheme.value)}
              className={isSelected ? "format-card format-card--selected" : "format-card"}
            >
              <span className="format-card__top">
                <span className="format-card__scheme">{scheme.value === "FREE" ? "LIBRE" : scheme.value}</span>
                <span className="format-card__check" aria-hidden="true">{isSelected ? "✓" : ""}</span>
              </span>
              <span className="format-card__preview" aria-hidden="true">
                {scheme.preview.map((letter, index) => (
                  <span
                    key={index}
                    className={[
                      "format-card__letter",
                      scheme.value === "FREE" ? "format-card__letter--free" : "format-card__letter--" + letter.toLowerCase(),
                    ].join(" ")}
                  >
                    {letter}
                  </span>
                ))}
              </span>
              <span className="format-card__label">{scheme.label}</span>
              <span className="format-card__detail">{scheme.detail}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
