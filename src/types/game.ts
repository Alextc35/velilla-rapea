export type RhymeScheme =
  | "AABB"
  | "ABAB"
  | "AAAA";

export type GameStatus =
  | "idle"
  | "playing"
  | "stopped";

export type GameConfig = {
  bpm: number;
  beatsPerBar: number;
  numberOfBars: number;
  rhymeScheme: RhymeScheme;
  audioUrl: string;
};

export type GameSession = {
  id: number;
  status: GameStatus;
  words: string[];
};