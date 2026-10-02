"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useBeatClock } from "@/hooks/useBeatClock";
import { useGameSession } from "@/hooks/useGameSession";
import type { Beat, BeatTag, RhymeScheme } from "@/types/game";

import { PatternGrid } from "./PatternGrid";
import { RhymeSchemeSelector } from "./RhymeSchemeSelector";

const BEATS_PER_BAR = 4;
const NUMBER_OF_BARS = 32;
const TAGS_STORAGE_KEY = "velilla-rapea:beat-tags:v1";
const FAVORITES_STORAGE_KEY = "velilla-rapea:favorites:v1";

type GameProps = {
  beats: Beat[];
};

type IconName = "search" | "shuffle" | "play" | "heart" | "spark" | "back" | "arrow" | "music";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, string> = {
    search: "M11 19a8 8 0 1 1 5.66-2.34L21 21M16.66 16.66 21 21",
    shuffle: "m18 14 4 4-4 4M18 2l4 4-4 4M2 18h2.5a5 5 0 0 0 4-2l7-10a5 5 0 0 1 4-2H22M2 6h2.5a5 5 0 0 1 4 2l1.4 2M14.5 14l1 1.5a5 5 0 0 0 4 2.5H22",
    play: "m7 4 13 8-13 8z",
    heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z",
    spark: "m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z",
    back: "m15 18-6-6 6-6M20 12H9",
    arrow: "M7 17 17 7M7 7h10v10",
    music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z",
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function artworkStyle(url: string | null) {
  return {
    backgroundImage: url
      ? 'linear-gradient(145deg, rgba(14, 15, 18, .04), rgba(14, 15, 18, .5)), url("' + url + '")'
      : "linear-gradient(140deg, #333940 0%, #21242b 46%, #9ab949 160%)",
  };
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatSchemeLabel(scheme: RhymeScheme) {
  return scheme === "FREE" ? "Libre" : scheme;
}

export function Game({ beats }: GameProps) {
  const artists = useMemo(() => {
    const artistMap = new Map<string, { name: string; image: string | null; count: number }>();

    beats.forEach((beat) => {
      const artist = artistMap.get(beat.artist);
      if (artist) {
        artist.count += 1;
      } else {
        artistMap.set(beat.artist, {
          name: beat.artist,
          image: beat.artistImage,
          count: 1,
        });
      }
    });

    return Array.from(artistMap.values());
  }, [beats]);

  const [activeArtist, setActiveArtist] = useState(artists[0]?.name ?? "all");
  const [mobileArtist, setMobileArtist] = useState<string | null>(null);
  const [mobileStep, setMobileStep] = useState(1);
  const [mobileSearch, setMobileSearch] = useState("");
  const [mobileStyleFilter, setMobileStyleFilter] = useState("Todas");
  const [mobileBpmFilter, setMobileBpmFilter] = useState("all");
  const [mobileRandomPick, setMobileRandomPick] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStyle, setActiveStyle] = useState("Todas");
  const [bpmFilter, setBpmFilter] = useState("all");
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [rhymeScheme, setRhymeScheme] = useState<RhymeScheme>("ABAB");
  const [sessionBpm, setSessionBpm] = useState(90);
  const [bpmDraft, setBpmDraft] = useState("");
  const [tagError, setTagError] = useState("");
  const [beatTags, setBeatTags] = useState<Record<string, BeatTag>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [inStudio, setInStudio] = useState(false);
  const [previewBeatId, setPreviewBeatId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState("");
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  const selectedBeat = beats.find((beat) => beat.id === selectedBeatId) ?? null;
  const previewBeat = beats.find((beat) => beat.id === previewBeatId) ?? null;
  const selectedBeatBpm = selectedBeat
    ? beatTags[selectedBeat.id]?.bpm ?? selectedBeat.bpm
    : null;

  const styles = useMemo(() => {
    return ["Todas", ...Array.from(new Set(beats.map((beat) => beat.style))).sort((a, b) => a.localeCompare(b, "es"))];
  }, [beats]);

  const visibleBeats = useMemo(() => {
    const query = normalizeSearch(searchTerm.trim());

    return beats.filter((beat) => {
      const bpm = beatTags[beat.id]?.bpm ?? beat.bpm;
      const matchesArtist = activeArtist === "all" || beat.artist === activeArtist;
      const matchesStyle = activeStyle === "Todas" || beat.style === activeStyle;
      const matchesSearch = !query || normalizeSearch([beat.artist, beat.title, beat.style].join(" ")).includes(query);
      const matchesBpm =
        bpmFilter === "all" ||
        (bpmFilter === "untagged" && bpm === null) ||
        (bpmFilter === "under90" && bpm !== null && bpm < 90) ||
        (bpmFilter === "90to110" && bpm !== null && bpm >= 90 && bpm <= 110) ||
        (bpmFilter === "over110" && bpm !== null && bpm > 110);

      return matchesArtist && matchesStyle && matchesSearch && matchesBpm;
    });
  }, [activeArtist, activeStyle, beatTags, beats, bpmFilter, searchTerm]);

  const mobileCollectionBeats = useMemo(
    () => beats.filter((beat) => mobileArtist === "all" || beat.artist === mobileArtist),
    [beats, mobileArtist],
  );

  const mobileStyles = useMemo(
    () => Array.from(new Set(mobileCollectionBeats.map((beat) => beat.style))).sort((a, b) => a.localeCompare(b, "es")),
    [mobileCollectionBeats],
  );

  const mobileBeats = useMemo(() => {
    const query = normalizeSearch(mobileSearch.trim());

    return mobileCollectionBeats.filter((beat) => {
      const bpm = beatTags[beat.id]?.bpm ?? beat.bpm;
      const matchesSearch = !query || normalizeSearch([beat.artist, beat.title, beat.style].join(" ")).includes(query);
      const matchesStyle = mobileStyleFilter === "Todas" || beat.style === mobileStyleFilter;
      const matchesBpm =
        mobileBpmFilter === "all" ||
        (mobileBpmFilter === "untagged" && bpm === null) ||
        (mobileBpmFilter === "under90" && bpm !== null && bpm < 90) ||
        (mobileBpmFilter === "90to110" && bpm !== null && bpm >= 90 && bpm <= 110) ||
        (mobileBpmFilter === "over110" && bpm !== null && bpm > 110);

      return matchesSearch && matchesStyle && matchesBpm;
    });
  }, [beatTags, mobileBpmFilter, mobileCollectionBeats, mobileSearch, mobileStyleFilter]);

  const {
    session,
    prepareSession,
    stopSession,
  } = useGameSession({
    bpm: sessionBpm,
    beatsPerBar: BEATS_PER_BAR,
    numberOfBars: NUMBER_OF_BARS,
    rhymeScheme,
    audioUrl: selectedBeat?.audioUrl ?? "",
  });

  const clock = useBeatClock({
    bpm: sessionBpm,
    beatsPerBar: BEATS_PER_BAR,
    numberOfBars: NUMBER_OF_BARS,
    audioUrl: selectedBeat?.audioUrl ?? "",
  });

  useEffect(() => {
    try {
      const savedTags = window.localStorage.getItem(TAGS_STORAGE_KEY);
      const savedFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

      if (savedTags) setBeatTags(JSON.parse(savedTags) as Record<string, BeatTag>);
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites) as string[]);
    } catch {
      // Si el navegador bloquea el almacenamiento, la sesión sigue disponible.
    }
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".search-field input")?.focus();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => () => {
    if (previewTimerRef.current !== null) window.clearTimeout(previewTimerRef.current);
    const audio = previewAudioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      previewAudioRef.current = null;
    }
  }, []);

  function stopBeatPreview() {
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    const audio = previewAudioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      previewAudioRef.current = null;
    }

    setPreviewBeatId(null);
    setPreviewError("");
  }

  function startBeatPreview(beat: Beat) {
    stopBeatPreview();

    const audio = new Audio(beat.audioUrl);
    audio.preload = "auto";
    audio.volume = 0.8;
    previewAudioRef.current = audio;
    setPreviewBeatId(beat.id);

    const finish = (error = "") => {
      if (previewAudioRef.current !== audio) return;
      if (previewTimerRef.current !== null) {
        window.clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      previewAudioRef.current = null;
      setPreviewBeatId(null);
      setPreviewError(error);
    };

    audio.onended = () => finish();
    audio.onerror = () => finish("No se pudo cargar la prueba de audio.");
    void audio.play().then(() => {
      if (previewAudioRef.current === audio) {
        previewTimerRef.current = window.setTimeout(() => finish(), 10_000);
      }
    }).catch(() => finish("El navegador no pudo iniciar la prueba de audio."));
  }

  function selectBeat(beat: Beat) {
    if (clock.isPlaying || clock.isLoading) return;

    setSelectedBeatId(beat.id);
    const bpm = beatTags[beat.id]?.bpm ?? beat.bpm;
    setSessionBpm(bpm ?? 90);
    setBpmDraft(bpm === null ? "" : String(bpm));
    setTagError("");
    startBeatPreview(beat);

    if (window.matchMedia("(max-width: 760px)").matches) {
      window.setTimeout(() => {
        document.getElementById("formats")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }

  function continueToMobileBeats(collection = mobileArtist) {
    if (!collection) return;

    setMobileArtist(collection);
    setActiveArtist(collection);
    setSelectedBeatId(null);
    setBpmDraft("");
    setMobileSearch("");
    setMobileStyleFilter("Todas");
    setMobileBpmFilter("all");
    setMobileRandomPick(false);
    setMobileStep(2);
  }

  function chooseRandomForMobile(pool: Beat[]) {
    if (!pool.length) return;
    const choices = pool.length > 1 ? pool.filter((beat) => beat.id !== selectedBeatId) : pool;
    const beat = choices[Math.floor(Math.random() * choices.length)];
    if (!beat) return;

    setMobileArtist(beat.artist);
    setActiveArtist(beat.artist);
    setMobileSearch("");
    setMobileStyleFilter("Todas");
    setMobileBpmFilter("all");
    setSelectedBeatId(beat.id);
    const bpm = beatTags[beat.id]?.bpm ?? beat.bpm;
    setSessionBpm(bpm ?? 90);
    setBpmDraft(bpm === null ? "" : String(bpm));
    setTagError("");
    setMobileRandomPick(true);
    startBeatPreview(beat);
  }

  function surpriseMobileBeat() {
    chooseRandomForMobile(beats);
    setMobileStep(2);
  }

  function surpriseWithinMobileAlbum() {
    chooseRandomForMobile(mobileBeats);
  }

  function selectMobileBeat(beat: Beat) {
    if (clock.isPlaying || clock.isLoading) return;

    setSelectedBeatId(beat.id);
    setMobileRandomPick(false);
    const bpm = beatTags[beat.id]?.bpm ?? beat.bpm;
    setSessionBpm(bpm ?? 90);
    setBpmDraft(bpm === null ? "" : String(bpm));
    setTagError("");
    startBeatPreview(beat);
  }

  function advanceMobileStep() {
    if (mobileStep === 1) {
      continueToMobileBeats();
    } else if (mobileStep === 2 && selectedBeat) {
      stopBeatPreview();
      setMobileStep(3);
    } else if (mobileStep === 3) {
      setMobileStep(4);
    } else if (mobileStep === 4) {
      void startStudio();
    }
  }

  function goBackMobileStep() {
    if (mobileStep === 2) {
      stopBeatPreview();
      setMobileArtist(null);
      setSelectedBeatId(null);
      setMobileRandomPick(false);
      setMobileSearch("");
      setMobileStyleFilter("Todas");
      setMobileBpmFilter("all");
    }

    setMobileStep((step) => Math.max(1, step - 1));
  }

  function pickRandomBeat() {
    const pool = visibleBeats.length ? visibleBeats : beats;
    if (!pool.length) return;

    const choices = pool.length > 1 ? pool.filter((beat) => beat.id !== selectedBeatId) : pool;
    const beat = choices[Math.floor(Math.random() * choices.length)];
    if (!beat) return;

    setActiveArtist(beat.artist);
    selectBeat(beat);
  }

  function saveBeatBpm() {
    if (!selectedBeat) return;
    const bpm = Number(bpmDraft);

    if (!Number.isInteger(bpm) || bpm < 40 || bpm > 220) {
      setTagError("Usa un BPM entre 40 y 220.");
      return;
    }

    const nextTags = { ...beatTags, [selectedBeat.id]: { bpm } };
    setBeatTags(nextTags);
    setSessionBpm(bpm);
    setTagError("");

    try {
      window.localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(nextTags));
    } catch {
      setTagError("No se ha podido guardar en este dispositivo.");
    }
  }

  function toggleFavorite(beat: Beat) {
    const nextFavorites = favorites.includes(beat.id)
      ? favorites.filter((id) => id !== beat.id)
      : [...favorites, beat.id];

    setFavorites(nextFavorites);
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
    } catch {
      // Los favoritos son opcionales; no bloquean el entrenamiento.
    }
  }

  async function startStudio() {
    if (!selectedBeat) return;
    stopBeatPreview();
    prepareSession();
    setInStudio(true);
    const started = await clock.play();
    if (!started) stopSession();
  }

  async function startAnotherRound() {
    prepareSession();
    const started = await clock.play();
    if (!started) stopSession();
  }

  function stopRound() {
    clock.stop();
    stopSession();
  }

  function returnToLibrary() {
    clock.stop();
    stopSession();
    stopBeatPreview();
    setInStudio(false);
  }

  const beatCount = beats.length;
  const artistCount = artists.length;
  const roundStatus = clock.hasCompleted ? "complete" : session.status;
  const mobileStepContent = [
    { title: "Elige una colección", copy: "Empieza por un artista o abre todo el crate." },
    { title: mobileArtist === "all" ? "Elige una base" : "Elige el beat", copy: "Busca por estilo o BPM. Toca una base para escuchar 10 segundos." },
    { title: "Define el formato", copy: "El patrón marca cómo se ordenan las rimas en cada bloque." },
    { title: "Confirma la sesión", copy: "Revisa la base, el tempo y el reto antes de entrar." },
  ][mobileStep - 1];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" onClick={inStudio ? returnToLibrary : undefined}>
          <span className="brand__mark" aria-hidden="true">V</span>
          <span className="brand__name">velilla<span>rapea</span></span>
          <span className="brand__beta">BETA</span>
        </a>
        <nav className="topbar__nav" aria-label="Navegación principal">
          <a className={inStudio ? "" : "topbar__link--active"} href="#library" onClick={inStudio ? returnToLibrary : undefined}>
            Biblioteca
          </a>
          <a className={inStudio ? "topbar__link--active" : ""} href={inStudio ? "#player" : "#formats"}>
            Estudio
          </a>
        </nav>
        <div className="crew-chip">
          <span className="crew-chip__light" />
          <span>SALA ABIERTA</span>
          <span className="crew-chip__divider" />
          <span>+50 MCs</span>
        </div>
      </header>

      {inStudio && selectedBeat ? (
        <main className="studio-page" id="player">
          <button type="button" className="back-link" onClick={returnToLibrary}>
            <Icon name="back" size={17} />
            Volver a la biblioteca
          </button>

          <section className="studio-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow__line" /> ESTUDIO DE IMPROVISACIÓN</p>
              <h1>Que corra el <span>flow.</span></h1>
              <p className="studio-heading__copy">Cuatro tiempos por barra. Tu voz lleva el resto.</p>
            </div>
            <div className="studio-heading__meta">
              <span className={"status-pill status-pill--" + roundStatus}>
                <span />
                {roundStatus === "playing" ? "EN DIRECTO" : roundStatus === "complete" ? "RONDA COMPLETA" : roundStatus === "stopped" ? "EN PAUSA" : "PREPARADO"}
              </span>
              <span className="studio-heading__round">RONDA {String(session.id).padStart(2, "0")}</span>
            </div>
          </section>

          <div className="studio-layout">
            <section className="studio-main">
              <div className="player-card">
                <div className="player-card__top">
                  <div>
                    <p className="eyebrow eyebrow--muted">PATRÓN DE 4 BARRAS</p>
                    <h2>{formatSchemeLabel(rhymeScheme)} <span>·</span> {sessionBpm} BPM</h2>
                  </div>
                  <div className="bar-counter">
                    <span className="bar-counter__label">BARRA</span>
                    <strong>{String(clock.currentBar).padStart(2, "0")}</strong>
                    <span className="bar-counter__total">/ {NUMBER_OF_BARS}</span>
                  </div>
                </div>

                <div className="progress-track" aria-label="Progreso de la ronda">
                  <span
                    className="progress-track__fill"
                    style={{
                      width: (clock.hasCompleted ? 100 : ((clock.currentBar - 1) / NUMBER_OF_BARS) * 100) + "%",
                    }}
                  />
                </div>

                <PatternGrid
                  words={session.words}
                  currentBar={clock.currentBar}
                  currentBeat={clock.currentBeat}
                  isPlaying={clock.isPlaying}
                  hasCompleted={clock.hasCompleted}
                  rhymeScheme={rhymeScheme}
                />

                <div className="player-card__bottom">
                  <div className="beat-count">
                    <span className="beat-count__label">TIEMPO</span>
                    {[1, 2, 3, 4].map((beat) => (
                      <span
                        key={beat}
                        className={[
                          "beat-count__number",
                          clock.isPlaying && clock.currentBeat === beat ? "beat-count__number--active" : "",
                          clock.isPlaying && clock.currentBeat > beat ? "beat-count__number--past" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        {beat}
                      </span>
                    ))}
                  </div>
                  <p className="player-card__hint">
                    {clock.hasCompleted
                      ? "Buen trabajo. ¿Otra vuelta?"
                      : clock.isPlaying
                        ? "Remata la palabra al cuarto tiempo."
                        : "Dale al play cuando el grupo esté listo."}
                  </p>
                </div>
              </div>

              {clock.error && <p className="audio-error" role="alert">{clock.error}</p>}

              <div className="studio-controls">
                <button type="button" className="studio-controls__secondary" onClick={stopRound}>
                  PARAR RONDA
                </button>
                <button
                  type="button"
                  className="studio-controls__primary"
                  onClick={() => {
                    if (clock.isPlaying) {
                      stopRound();
                    } else if (clock.hasCompleted || roundStatus === "stopped") {
                      void startAnotherRound();
                    } else {
                      void clock.play();
                    }
                  }}
                  disabled={clock.isLoading}
                >
                  <span className="studio-controls__play-icon">
                    {clock.isPlaying ? "Ⅱ" : "▶"}
                  </span>
                  {clock.isLoading
                    ? "CARGANDO BASE…"
                    : clock.isPlaying
                      ? "PAUSAR SESIÓN"
                      : clock.hasCompleted || roundStatus === "stopped"
                        ? "OTRA RONDA"
                        : "EMPEZAR RONDA"}
                </button>
              </div>
            </section>

            <aside className="studio-rail">
              <div className="studio-beat-card">
                <div className="studio-beat-card__art" style={artworkStyle(selectedBeat.imageUrl)}>
                  <span className="studio-beat-card__disc" />
                  <span className="studio-beat-card__artist-mark">{selectedBeat.artist.charAt(0)}</span>
                </div>
                <div className="studio-beat-card__copy">
                  <p className="eyebrow eyebrow--muted">BASE EN ROTACIÓN</p>
                  <h3>{selectedBeat.title}</h3>
                  <p>{selectedBeat.artist} <span>·</span> {selectedBeat.style}</p>
                </div>
                <div className="studio-beat-card__tags">
                  <span><Icon name="music" size={14} /> {selectedBeatBpm ? selectedBeatBpm + " BPM" : sessionBpm + " BPM sesión"}</span>
                  <span>{formatSchemeLabel(rhymeScheme)}</span>
                </div>
              </div>

              <div className="studio-tip">
                <span className="studio-tip__icon"><Icon name="spark" size={17} /></span>
                <div>
                  <p>RETO DE HOY</p>
                  <span>{rhymeScheme === "FREE" ? "Usa cada palabra como punto de partida; el camino es tuyo." : "Encuentra una rima distinta y aterriza cada barra en el tiempo cuatro."}</span>
                </div>
              </div>
              <p className="studio-rail__footnote">La ronda dura 32 barras. El grupo puede parar antes cuando quiera.</p>
            </aside>
          </div>
        </main>
      ) : (
        <main className="library-page" id="inicio">
          <section className={mobileStep === 1 ? "mobile-wizard mobile-wizard--collection" : "mobile-wizard"} aria-label="Configurar sesión">
            <div className="mobile-wizard__progress" aria-label={`Paso ${mobileStep} de 4`}>
              {[
                { title: "Colección", number: 1 },
                { title: "Beat", number: 2 },
                { title: "Formato", number: 3 },
                { title: "Confirmar", number: 4 },
              ].map((step) => (
                <div
                  key={step.number}
                  className={[
                    "mobile-wizard__progress-step",
                    mobileStep === step.number ? "mobile-wizard__progress-step--active" : "",
                    mobileStep > step.number ? "mobile-wizard__progress-step--complete" : "",
                  ].filter(Boolean).join(" ")}
                  aria-current={mobileStep === step.number ? "step" : undefined}
                >
                  <span>{mobileStep > step.number ? "✓" : String(step.number).padStart(2, "0")}</span>
                  <small>{step.title}</small>
                </div>
              ))}
            </div>

            <div className="mobile-wizard__heading">
              <p className="eyebrow"><span className="eyebrow__line" /> CONFIGURA TU RONDA <span className="mobile-wizard__step-count">PASO 0{mobileStep} / 04</span></p>
              <h1>{mobileStepContent.title}</h1>
              <p>{mobileStepContent.copy}</p>
            </div>

            {mobileStep === 1 && (
              <div className="mobile-wizard__screen">
                <div className="mobile-collection-grid" aria-label="Colecciones de beats">
                  <button
                    type="button"
                    className={mobileArtist === "all" ? "mobile-collection mobile-collection--all mobile-collection--selected" : "mobile-collection mobile-collection--all"}
                    onClick={() => continueToMobileBeats("all")}
                    aria-pressed={mobileArtist === "all"}
                  >
                    <span className="mobile-collection__icon"><Icon name="music" size={22} /></span>
                    <span className="mobile-collection__copy"><strong>Todo el crate</strong><small>{beatCount} BASES</small></span>
                    <span className="mobile-collection__check">{mobileArtist === "all" ? "✓" : "↗"}</span>
                  </button>
                  {artists.map((artist) => (
                    <button
                      key={artist.name}
                      type="button"
                      className={mobileArtist === artist.name ? "mobile-collection mobile-collection--selected" : "mobile-collection"}
                      style={artworkStyle(artist.image)}
                      onClick={() => continueToMobileBeats(artist.name)}
                      aria-pressed={mobileArtist === artist.name}
                    >
                      <span className="mobile-collection__copy"><strong>{artist.name}</strong><small>{artist.count} BEATS</small></span>
                      <span className="mobile-collection__check">{mobileArtist === artist.name ? "✓" : "↗"}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="mobile-wizard__surprise" onClick={surpriseMobileBeat} disabled={!beats.length || clock.isLoading}>
                  <Icon name="shuffle" size={16} /> Elegir colección y beat al azar
                </button>
              </div>
            )}

            {mobileStep === 2 && (
              <div className="mobile-wizard__screen mobile-wizard__screen--beats">
                <div className="mobile-beat-tools">
                  <span className="mobile-beat-tools__collection">{mobileArtist === "all" ? "TODO EL CRATE" : mobileArtist}</span>
                  <button type="button" onClick={surpriseWithinMobileAlbum} disabled={!mobileBeats.length || clock.isLoading}>
                    <Icon name="shuffle" size={14} /> Al azar
                  </button>
                </div>
                <label className="mobile-beat-search">
                  <Icon name="search" size={16} />
                  <span className="visually-hidden">Buscar una base</span>
                  <input type="search" value={mobileSearch} onChange={(event) => setMobileSearch(event.target.value)} placeholder="Buscar base o estilo…" />
                  <span>{mobileBeats.length}</span>
                </label>
                <div className="mobile-beat-filters">
                  <label>
                    <span className="visually-hidden">Filtrar por estilo</span>
                    <select value={mobileStyleFilter} onChange={(event) => setMobileStyleFilter(event.target.value)}>
                      <option value="Todas">Todos los estilos</option>
                      {mobileStyles.map((style) => <option key={style} value={style}>{style}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="visually-hidden">Filtrar por BPM</span>
                    <select value={mobileBpmFilter} onChange={(event) => setMobileBpmFilter(event.target.value)}>
                      <option value="all">Cualquier BPM</option>
                      <option value="untagged">Por etiquetar</option>
                      <option value="under90">Menos de 90</option>
                      <option value="90to110">90–110 BPM</option>
                      <option value="over110">Más de 110</option>
                    </select>
                  </label>
                </div>
                {previewBeat && (
                  <div className="mobile-preview-banner" role="status">
                    <span className="mobile-preview-banner__pulse" />
                    <span><small>PRUEBA · 10 SEGUNDOS</small><strong>{previewBeat.title}</strong></span>
                    <button type="button" onClick={stopBeatPreview} aria-label="Detener prueba">×</button>
                  </div>
                )}
                {previewError && <p className="mobile-preview-error" role="alert">{previewError}</p>}
                {mobileBeats.length ? (
                  <div className="mobile-beat-grid" aria-label="Bases disponibles">
                    {mobileBeats.map((beat) => {
                      const isSelected = selectedBeatId === beat.id;
                      const bpm = beatTags[beat.id]?.bpm ?? beat.bpm;
                      return (
                        <button
                          key={beat.id}
                          type="button"
                          className={isSelected ? "mobile-beat mobile-beat--selected" : "mobile-beat"}
                          onClick={() => selectMobileBeat(beat)}
                          aria-pressed={isSelected}
                          aria-label={`Seleccionar ${beat.title} y escuchar una muestra de 10 segundos`}
                        >
                          <span className="mobile-beat__art" style={artworkStyle(beat.imageUrl)}>
                            <span className="mobile-beat__play">{previewBeatId === beat.id ? "Ⅱ" : isSelected ? "✓" : <Icon name="play" size={15} />}</span>
                            <span className="mobile-beat__tag">{bpm ? `${bpm} BPM` : beat.style}</span>
                            <span className="mobile-beat__duration">0:10</span>
                          </span>
                          <span className="mobile-beat__copy"><strong>{beat.title}</strong><small>{beat.artist} · {beat.style}</small></span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mobile-beat-empty">No hay bases con esa búsqueda.</div>
                )}
                {mobileRandomPick && selectedBeat && <p className="mobile-wizard__random-note">Sorpresa: {selectedBeat.artist} · {selectedBeat.title}</p>}
              </div>
            )}

            {mobileStep === 3 && (
              <div className="mobile-wizard__screen mobile-wizard__screen--format">
                <div className="setup-card mobile-format-card">
                  <RhymeSchemeSelector value={rhymeScheme} onChange={setRhymeScheme} />
                  <div className="setup-card__divider" />
                  <div className="tempo-control">
                    <div>
                      <p className="field-label">Tempo de la sesión</p>
                      <span className="tempo-control__hint">Ajusta el pulso para el grupo.</span>
                    </div>
                    <div className="tempo-stepper">
                      <button type="button" aria-label="Bajar BPM" onClick={() => setSessionBpm((bpm) => Math.max(40, bpm - 1))}>−</button>
                      <label>
                        <input aria-label="BPM de la sesión" type="number" min={40} max={220} value={sessionBpm} onChange={(event) => setSessionBpm(Math.min(220, Math.max(40, Number(event.target.value) || 40)))} />
                        <span>BPM</span>
                      </label>
                      <button type="button" aria-label="Subir BPM" onClick={() => setSessionBpm((bpm) => Math.min(220, bpm + 1))}>+</button>
                    </div>
                  </div>
                </div>
                {selectedBeat && <div className="mobile-wizard__selected-line"><span style={artworkStyle(selectedBeat.imageUrl)} /><div><small>BASE SELECCIONADA</small><strong>{selectedBeat.title}</strong><small>{selectedBeat.artist}</small></div></div>}
              </div>
            )}

            {mobileStep === 4 && (
              <div className="mobile-wizard__screen mobile-wizard__screen--confirm">
                {selectedBeat && (
                  <article className="mobile-confirm-card">
                    <div className="mobile-confirm-card__art" style={artworkStyle(selectedBeat.imageUrl)}>
                      <span className="mobile-confirm-card__disc" />
                    </div>
                    <div className="mobile-confirm-card__copy">
                      <span>BASE ELEGIDA</span>
                      <h2>{selectedBeat.title}</h2>
                      <p>{selectedBeat.artist} <i>·</i> {selectedBeat.style}</p>
                    </div>
                    <div className="mobile-confirm-card__meta"><span>{sessionBpm} BPM</span><span>{formatSchemeLabel(rhymeScheme)}</span><span>{NUMBER_OF_BARS} barras</span></div>
                  </article>
                )}
                {selectedBeat && (
                  <div className="bpm-tag-editor mobile-bpm-editor">
                    <label htmlFor="mobile-tag-bpm">¿SABES EL BPM REAL?</label>
                    <div>
                      <input id="mobile-tag-bpm" type="number" inputMode="numeric" min={40} max={220} placeholder="Ej. 92" value={bpmDraft} onChange={(event) => setBpmDraft(event.target.value)} />
                      <button type="button" onClick={saveBeatBpm}>Guardar</button>
                    </div>
                    {tagError && <span className="bpm-tag-editor__error" role="alert">{tagError}</span>}
                    <small>Se guarda en este dispositivo y ajusta el tempo de la ronda.</small>
                  </div>
                )}
                <p className="mobile-confirm-note"><Icon name="spark" size={16} /> 4 tiempos por barra. 32 barras para que fluya el grupo.</p>
              </div>
            )}

            {mobileStep > 1 && (
              <div className="mobile-wizard__footer">
                <button type="button" className="mobile-wizard__back" onClick={goBackMobileStep}>
                  Atrás
                </button>
                <button
                  type="button"
                  className="mobile-wizard__next"
                  onClick={advanceMobileStep}
                  disabled={(mobileStep === 2 && !selectedBeat) || (mobileStep === 4 && (!selectedBeat || clock.isLoading))}
                >
                  {mobileStep === 4 ? (clock.isLoading ? "Cargando base…" : "Entrar al estudio") : mobileStep === 2 ? "Elegir formato" : "Revisar sesión"}
                  {mobileStep < 4 && <Icon name="arrow" size={16} />}
                </button>
              </div>
            )}
          </section>

          <section className="hero">
            <div className="hero__copy">
              <p className="eyebrow"><span className="eyebrow__line" /> EL ESTUDIO DE FREESTYLE DE VELILLA</p>
              <h1>Encuentra tu <span>flow.</span><br />Una barra a la vez.</h1>
              <p className="hero__description">
                Elige una base, marca el patrón y deja que el grupo improvise. Un espacio para entrenar, fallar y volver a entrar.
              </p>
              <div className="hero__stats">
                <span><strong>{beatCount}</strong> bases</span>
                <span className="hero__stat-dot">·</span>
                <span><strong>{artistCount}</strong> colecciones</span>
                <span className="hero__stat-dot">·</span>
                <span>4 tiempos por barra</span>
              </div>
            </div>
            <div className="hero__actions">
              <p>¿Que el beat elija por ti?</p>
              <button type="button" className="random-button" onClick={pickRandomBeat} disabled={!beats.length}>
                <span className="random-button__icon"><Icon name="shuffle" size={18} /></span>
                Sorpréndeme
                <Icon name="arrow" size={16} />
              </button>
              <span className="hero__random-note">Escoge una base de tu selección actual.</span>
            </div>
            <div className="hero__stamp" aria-hidden="true">
              <span>IMPRO</span>
              <strong>★</strong>
              <span>EN VIVO</span>
            </div>
          </section>

          <section className="library-section" id="library">
            <div className="section-title">
              <div className="section-title__main">
                <span className="step-number">01</span>
                <div>
                  <p className="eyebrow eyebrow--muted">ARMA TU SET</p>
                  <h2>Elige una base</h2>
                </div>
              </div>
              <span className="section-title__aside">PRIMERO EL SONIDO<span> · </span>DESPUÉS EL RESTO</span>
            </div>

            <div className="library-workspace">
              <div className="library-browser">
                <div className="collection-strip" aria-label="Colecciones de beats">
              <button
                type="button"
                className={activeArtist === "all" ? "collection-card collection-card--selected collection-card--all" : "collection-card collection-card--all"}
                onClick={() => setActiveArtist("all")}
                aria-pressed={activeArtist === "all"}
              >
                <span className="collection-card__all-mark"><Icon name="music" size={23} /></span>
                <span className="collection-card__overlay" />
                <span className="collection-card__copy">
                  <strong>Todo el crate</strong>
                  <small>{beatCount} BASES <span>↗</span></small>
                </span>
                <span className="collection-card__arrow"><Icon name="arrow" size={15} /></span>
              </button>
              {artists.map((artist) => (
                <button
                  key={artist.name}
                  type="button"
                  className={[
                    "collection-card",
                    activeArtist === artist.name ? "collection-card--selected" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => setActiveArtist(artist.name)}
                  aria-pressed={activeArtist === artist.name}
                >
                  <span className="collection-card__image" style={artworkStyle(artist.image)} />
                  <span className="collection-card__overlay" />
                  <span className="collection-card__copy">
                    <strong>{artist.name}</strong>
                    <small>{String(artist.count).padStart(2, "0")} BEATS <span>↗</span></small>
                  </span>
                  <span className="collection-card__arrow"><Icon name="arrow" size={15} /></span>
                </button>
              ))}
                </div>

            <div className="crate-header">
              <div>
                <h3>{activeArtist === "all" ? "Todas las bases" : activeArtist}</h3>
                <p>{visibleBeats.length} {visibleBeats.length === 1 ? "resultado" : "bases"} listas para soltar barras</p>
              </div>
              <div className="crate-header__mark"><span /> CRATE SELECCIONADO</div>
            </div>

            <div className="library-toolbar">
              <label className="search-field">
                <Icon name="search" size={17} />
                <span className="visually-hidden">Buscar bases, artistas o estilos</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Busca base, artista o estilo…"
                />
                <kbd>CTRL K</kbd>
              </label>
              <label className="filter-field">
                <span className="visually-hidden">Filtrar por estilo</span>
                <select value={activeStyle} onChange={(event) => setActiveStyle(event.target.value)}>
                  {styles.map((style) => <option key={style} value={style}>{style === "Todas" ? "Todos los estilos" : style}</option>)}
                </select>
              </label>
              <label className="filter-field filter-field--bpm">
                <span className="filter-field__label">BPM</span>
                <select value={bpmFilter} onChange={(event) => setBpmFilter(event.target.value)}>
                  <option value="all">Cualquiera</option>
                  <option value="untagged">Por etiquetar</option>
                  <option value="under90">Menos de 90</option>
                  <option value="90to110">90–110</option>
                  <option value="over110">Más de 110</option>
                </select>
              </label>
            </div>

                {visibleBeats.length ? (
              <div className="beat-grid">
                {visibleBeats.map((beat, index) => {
                  const isSelected = selectedBeatId === beat.id;
                  const isFavorite = favorites.includes(beat.id);
                  const bpm = beatTags[beat.id]?.bpm ?? beat.bpm;

                  return (
                    <article
                      className={isSelected ? "beat-card beat-card--selected" : "beat-card"}
                      key={beat.id}
                    >
                      <button
                        type="button"
                        className="beat-card__pick"
                        onClick={() => selectBeat(beat)}
                        aria-pressed={isSelected}
                        aria-label={"Elegir " + beat.title + " de " + beat.artist}
                      >
                        <span className="beat-card__art" style={artworkStyle(beat.imageUrl)}>
                          <span className="beat-card__index">{String(index + 1).padStart(2, "0")}</span>
                          <span className={isSelected ? "beat-card__play beat-card__play--selected" : "beat-card__play"}>
                            {isSelected ? "✓" : <Icon name="play" size={15} />}
                          </span>
                          <span className="beat-card__art-bottom">
                            <span>{beat.style.toUpperCase()}</span>
                            {bpm ? <span>{bpm} BPM</span> : <span className="beat-card__pending">BPM PENDIENTE</span>}
                          </span>
                        </span>
                        <span className="beat-card__details">
                          {activeArtist === "all" && <span className="beat-card__artist">{beat.artist}</span>}
                          <strong>{beat.title}</strong>
                          <span className="beat-card__subtitle">SELECCIÓN #{String(beat.trackNumber).padStart(2, "0")}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={isFavorite ? "favorite-button favorite-button--active" : "favorite-button"}
                        aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                        aria-pressed={isFavorite}
                        onClick={() => toggleFavorite(beat)}
                      >
                        <Icon name="heart" size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
                ) : (
              <div className="empty-state">
                <span className="empty-state__icon"><Icon name="search" size={22} /></span>
                <h3>No encontramos bases con esos filtros</h3>
                <p>Prueba otro estilo, BPM o término de búsqueda.</p>
                <button type="button" onClick={() => {
                  setSearchTerm("");
                  setActiveStyle("Todas");
                  setBpmFilter("all");
                  setActiveArtist("all");
                }}>
                  Ver toda la biblioteca
                </button>
              </div>
                )}
              </div>

              <aside className="setup-sidebar" id="formats">
                <div className="section-title section-title--sidebar">
                  <div className="section-title__main">
                    <span className="step-number">02</span>
                    <div>
                      <p className="eyebrow eyebrow--muted">DEFINE EL RETO</p>
                      <h2>Prepara la sesión</h2>
                    </div>
                  </div>
                </div>
                <div className="setup-card setup-card--sidebar">
                  <RhymeSchemeSelector value={rhymeScheme} onChange={setRhymeScheme} />
                  <div className="setup-card__divider" />
                  <div className="tempo-control">
                    <div>
                      <p className="field-label">Tempo de la sesión</p>
                      <span className="tempo-control__hint">Ajusta el metrónomo visual a tu grupo.</span>
                    </div>
                    <div className="tempo-stepper">
                      <button type="button" aria-label="Bajar BPM" onClick={() => setSessionBpm((bpm) => Math.max(40, bpm - 1))}>−</button>
                      <label>
                        <input
                          aria-label="BPM de la sesión"
                          type="number"
                          min={40}
                          max={220}
                          value={sessionBpm}
                          onChange={(event) => setSessionBpm(Math.min(220, Math.max(40, Number(event.target.value) || 40)))}
                        />
                        <span>BPM</span>
                      </label>
                      <button type="button" aria-label="Subir BPM" onClick={() => setSessionBpm((bpm) => Math.min(220, bpm + 1))}>+</button>
                    </div>
                  </div>
                </div>

                <div className="session-summary">
                <div className="session-summary__top">
                  <span className="session-summary__spark"><Icon name="spark" size={17} /></span>
                  <span className="eyebrow eyebrow--muted">TU PRÓXIMA RONDA</span>
                </div>
                {selectedBeat ? (
                  <div className="selected-beat">
                    <span className="selected-beat__art" style={artworkStyle(selectedBeat.imageUrl)}>
                      <span className="selected-beat__play"><Icon name="play" size={14} /></span>
                    </span>
                    <span className="selected-beat__copy">
                      <strong>{selectedBeat.title}</strong>
                      <small>{selectedBeat.artist} · {selectedBeat.style}</small>
                      <small>{selectedBeatBpm ? selectedBeatBpm + " BPM en biblioteca" : "BPM pendiente de etiquetar"}</small>
                    </span>
                  </div>
                ) : (
                  <div className="selected-empty">
                    <span className="selected-empty__icon"><Icon name="music" size={20} /></span>
                    <strong>Tu base va aquí</strong>
                    <span>Elige una pista o deja que el crate te sorprenda.</span>
                  </div>
                )}

                {selectedBeat && (
                  <div className="bpm-tag-editor">
                    <label htmlFor="tag-bpm">ETIQUETAR BPM REAL</label>
                    <div>
                      <input
                        id="tag-bpm"
                        type="number"
                        inputMode="numeric"
                        min={40}
                        max={220}
                        placeholder="Ej. 92"
                        value={bpmDraft}
                        onChange={(event) => setBpmDraft(event.target.value)}
                      />
                      <button type="button" onClick={saveBeatBpm}>Guardar</button>
                    </div>
                    {tagError && <span className="bpm-tag-editor__error" role="alert">{tagError}</span>}
                    <small>La etiqueta se guarda en este dispositivo.</small>
                  </div>
                )}

                <div className="session-summary__meta">
                  <span><strong>{formatSchemeLabel(rhymeScheme)}</strong> formato</span>
                  <span><strong>{sessionBpm}</strong> BPM</span>
                  <span><strong>{NUMBER_OF_BARS}</strong> barras</span>
                </div>
                <button
                  type="button"
                  className="launch-button"
                  onClick={() => void startStudio()}
                  disabled={!selectedBeat || clock.isLoading}
                >
                  <span>{clock.isLoading ? "CARGANDO…" : "ENTRAR AL ESTUDIO"}</span>
                  <span className="launch-button__arrow"><Icon name="arrow" size={17} /></span>
                </button>
                <button type="button" className="summary-random" onClick={pickRandomBeat} disabled={!beats.length}>
                  <Icon name="shuffle" size={14} /> Elegir otra base al azar
                </button>
                </div>
              </aside>
            </div>
          </section>
          <footer className="page-footer">
            <span className="page-footer__brand">velilla<span>rapea</span></span>
            <span>ENTRENAR TAMBIÉN ES JUGAR.</span>
            <span>{beatCount} BASES <i>·</i> {artistCount} COLECCIONES</span>
          </footer>
        </main>
      )}
    </div>
  );
}
