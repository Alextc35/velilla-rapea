import { Game } from "@/components/game/Game";
import { getBeatLibrary } from "@/lib/beats";

export default async function Home() {
  const beats = await getBeatLibrary();

  return <Game beats={beats} />;
}
