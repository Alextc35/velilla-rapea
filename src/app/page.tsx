import { Game } from "@/components/game/Game";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <Game />
    </main>
  );
}