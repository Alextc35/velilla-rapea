import { readdir } from "node:fs/promises";
import path from "node:path";

import type { Beat } from "@/types/game";

const BEATS_DIRECTORY = path.join(process.cwd(), "public", "beats");
const DEMO_BEAT: Beat = {
  id: "velilla-rapea-demo-90bpm",
  artist: "VelillaRapea",
  artistImage: null,
  title: "Beat de entrenamiento",
  style: "Freestyle",
  bpm: 90,
  trackNumber: 1,
  audioUrl: "/beats/beat-90bpm.mp3",
  imageUrl: null,
};

function mediaUrl(parts: string[]) {
  return "/beats/" + parts.map(encodeURIComponent).join("/");
}

function getStyle(title: string) {
  const value = title.toLowerCase();

  if (value.includes("drill")) return "Drill";
  if (value.includes("boom bap") || value.includes("boom-bap") || value.includes("old school") || value.includes("90s")) return "Boom bap";
  if (value.includes("guitar") || value.includes("guitarra")) return "Guitarra";
  if (value.includes("piano") || value.includes("sad") || value.includes("pain") || value.includes("emotional") || value.includes("cry")) return "Emocional";
  if (value.includes("afro") || value.includes("dancehall")) return "Afro";
  if (value.includes("trap")) return "Trap";
  if (value.includes("rap") || value.includes("hip hop") || value.includes("freestyle")) return "Hip hop";

  return "Freestyle";
}

function getBpm(title: string) {
  const match = title.normalize("NFKC").match(/\b(\d{2,3})\s*(?:bpm|beats per minute)\b/i);
  const bpm = match?.[1] ? Number(match[1]) : null;

  return bpm && bpm >= 40 && bpm <= 220 ? bpm : null;
}

function getDisplayTitle(filename: string) {
  const title = path.parse(filename).name
    .normalize("NFKC")
    .replace(/[|｜].*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  return title || "Beat sin título";
}

async function getImageFilename(directory: string) {
  const files = await readdir(directory);

  return files.find((file) => /^hq(?:720|default)\.avif$/i.test(file)) ?? null;
}

async function getArtistImage(directory: string) {
  const files = await readdir(directory);

  return files.find((file) => /^channels4_banner\.(?:jpg|jpeg|png|avif)$/i.test(file)) ?? null;
}

export async function getBeatLibrary(): Promise<Beat[]> {
  let artistDirectories;

  try {
    artistDirectories = await readdir(BEATS_DIRECTORY, { withFileTypes: true });
  } catch {
    return [DEMO_BEAT];
  }

  const beats: Beat[] = [];
  const artists = artistDirectories
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name, "es"));

  for (const artistEntry of artists) {
    const artistDirectory = path.join(BEATS_DIRECTORY, artistEntry.name);
    const [trackEntries, artistImage] = await Promise.all([
      readdir(artistDirectory, { withFileTypes: true }),
      getArtistImage(artistDirectory),
    ]);

    const trackDirectories = trackEntries
      .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
      .sort((left, right) => Number(left.name) - Number(right.name));

    for (const trackDirectory of trackDirectories) {
      const directory = path.join(artistDirectory, trackDirectory.name);
      const entries = await readdir(directory, { withFileTypes: true });
      const audioFile = entries.find(
        (entry) => entry.isFile() && /\.(?:mp4|mp3|m4a|wav|ogg)$/i.test(entry.name),
      );

      if (!audioFile) continue;

      const imageFile = await getImageFilename(directory);
      const title = getDisplayTitle(audioFile.name);
      const artistImagePath = artistImage ? [artistEntry.name, artistImage] : null;

      beats.push({
        id: artistEntry.name + "-" + trackDirectory.name,
        artist: artistEntry.name,
        artistImage: artistImagePath ? mediaUrl(artistImagePath) : null,
        title,
        style: getStyle(audioFile.name),
        bpm: getBpm(audioFile.name),
        trackNumber: Number(trackDirectory.name),
        audioUrl: mediaUrl([artistEntry.name, trackDirectory.name, audioFile.name]),
        imageUrl: imageFile ? mediaUrl([artistEntry.name, trackDirectory.name, imageFile]) : null,
      });
    }
  }

  return beats.length ? beats : [DEMO_BEAT];
}
