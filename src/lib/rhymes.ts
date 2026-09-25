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

export function createRhymeSequence(): string[] {
  return rhymeFamilies.flatMap((family) => family.words);
}