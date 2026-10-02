export type RhymeScheme = "AAAA" | "ABAB" | "ABBA" | "FREE";

export type GameStatus = "idle" | "playing" | "stopped" | "complete";

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

export type Beat = {
  id: string;
  artist: string;
  artistImage: string | null;
  title: string;
  style: string;
  bpm: number | null;
  trackNumber: number;
  audioUrl: string;
  imageUrl: string | null;
};

export type BeatTag = {
  bpm: number;
};
