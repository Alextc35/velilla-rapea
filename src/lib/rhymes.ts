import type { RhymeScheme } from "@/types/game";

export type RhymeFamily = {
  id: string;
  words: string[];
};

export const rhymeFamilies: RhymeFamily[] = [
  {
    id: "asa",
    words: [
      "casa",
      "masa",
      "pasa",
      "tasa",
      "brasa",
    ],
  },
  {
    id: "on",
    words: [
      "canción",
      "pasión",
      "razón",
      "ocasión",
      "misión",
    ],
  },
  {
    id: "ente",
    words: [
      "mente",
      "gente",
      "frente",
      "presente",
      "diferente",
    ],
  },
  {
    id: "ado",
    words: [
      "lado",
      "estado",
      "pasado",
      "mercado",
      "cansado",
    ],
  },
];

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1),
    );

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function pickWords(
  family: RhymeFamily,
  amount: number,
): string[] {
  return shuffle(family.words).slice(
    0,
    amount,
  );
}

function getTwoFamilies(
  previousFamilyIds: string[],
): [RhymeFamily, RhymeFamily] {
  const available = rhymeFamilies.filter(
    (family) =>
      !previousFamilyIds.includes(
        family.id,
      ),
  );

  const pool =
    available.length >= 2
      ? available
      : rhymeFamilies;

  const shuffled = shuffle(pool);

  return [
    shuffled[0],
    shuffled[1],
  ];
}

export function createRhymeSequence(
  scheme: RhymeScheme,
  numberOfBars = 32,
): string[] {
  const sequence: string[] = [];

  let previousFamilyIds: string[] = [];

  while (
    sequence.length < numberOfBars
  ) {
    const [familyA, familyB] =
      getTwoFamilies(
        previousFamilyIds,
      );

    if (!familyA || !familyB) {
      break;
    }

    previousFamilyIds = [
      familyA.id,
      familyB.id,
    ];

    if (scheme === "AABB") {
      const a = pickWords(familyA, 2);
      const b = pickWords(familyB, 2);

      sequence.push(
        a[0],
        a[1],
        b[0],
        b[1],
      );
    }

    if (scheme === "ABAB") {
      const a = pickWords(familyA, 2);
      const b = pickWords(familyB, 2);

      sequence.push(
        a[0],
        b[0],
        a[1],
        b[1],
      );
    }

    if (scheme === "AAAA") {
      const a = pickWords(familyA, 4);

      sequence.push(...a);
    }
  }

  return sequence.slice(
    0,
    numberOfBars,
  );
}