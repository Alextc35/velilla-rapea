import type {
  RhymeScheme,
} from "@/types/game";

type RhymeSchemeSelectorProps = {
  value: RhymeScheme;
  disabled?: boolean;
  onChange: (
    scheme: RhymeScheme,
  ) => void;
};

const SCHEMES: {
  value: RhymeScheme;
  label: string;
  example: string;
}[] = [
  {
    value: "AABB",
    label: "Parejas",
    example: "A A B B",
  },
  {
    value: "ABAB",
    label: "Alternada",
    example: "A B A B",
  },
  {
    value: "AAAA",
    label: "Monorrima",
    example: "A A A A",
  },
];

export function RhymeSchemeSelector({
  value,
  disabled = false,
  onChange,
}: RhymeSchemeSelectorProps) {
  return (
    <div className="w-full space-y-3">
      <p className="text-sm font-medium text-neutral-400">
        Esquema de rima
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SCHEMES.map((scheme) => {
          const isSelected =
            scheme.value === value;

          return (
            <button
              key={scheme.value}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange(
                  scheme.value,
                )
              }
              className={[
                "rounded-2xl border px-5 py-4 text-left transition",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-white bg-white text-black"
                  : "border-neutral-800 bg-neutral-900 text-white hover:border-neutral-600",
              ].join(" ")}
            >
              <div className="font-bold">
                {scheme.value}
              </div>

              <div
                className={[
                  "mt-1 text-sm",
                  isSelected
                    ? "text-neutral-600"
                    : "text-neutral-400",
                ].join(" ")}
              >
                {scheme.label}
              </div>

              <div
                className={[
                  "mt-3 font-mono text-xs tracking-widest",
                  isSelected
                    ? "text-neutral-500"
                    : "text-neutral-600",
                ].join(" ")}
              >
                {scheme.example}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}