import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Crown, Pencil, Skull, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MuteButton } from "@/components/MuteButton";
import { ROLE_BY_ID, TEAM_LABEL, roleImage } from "@/data/roles";
import { NarratorCard } from "@/components/NarratorCard";
import { PhaseTransition } from "@/components/PhaseTransition";
import { SpeakButton } from "@/components/SpeakButton";
import { DebateQueue } from "@/components/DebateQueue";
import { EliminationReveal } from "@/components/EliminationReveal";
import {
  clearBgm,
  playCheer,
  playGavel,
  playVoteTick,
  playWolfHowl,
  startBgm,
} from "@/lib/audio";
import {
  clearGame,
  loadGame,
  loadSettings,
  loadSetup,
  saveGame,
  type GameSettings,
} from "@/lib/session";
import {
  createGame,
  currentStep,
  effectiveRoleId,
  eliminateTied,
  goToVote,
  resolveHunter,
  skipVote,
  submitStep,
  submitVote,
  assignCaptain,
  bearNeighbors,
  type GameState,
  type Player,
} from "@/game/engine";

const TITLE = "Partie en cours — Nightfall Oracle";
const DESC = "Le meneur guide la nuit, l'aube et le vote du village, tour après tour.";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<GameState | null>(null);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [transition, setTransition] = useState<"NIGHT" | "DAY" | null>("NIGHT");
  const [victims, setVictims] = useState<
    { id: string; name: string; roleId: string }[] | null
  >(null);
  const [debateDoneDay, setDebateDoneDay] = useState(0);
  const lastPhase = useRef<string>("");

  useEffect(() => {
    setSettings(loadSettings());
    const saved = loadGame<GameState>();
    if (saved) {
      setState(saved);
      return;
    }
    const setup = loadSetup();
    if (setup?.players?.length)
      setState(createGame(setup.players, setup.villageCaptainId));
    else navigate({ to: "/setup" });
  }, [navigate]);

  // Cartes de transition nuit/jour
  useEffect(() => {
    if (!state) return;
    const isNight = state.phase.startsWith("NUIT");
    const key = isNight ? `N${state.night}` : `${state.phase}${state.day}`;
    if (lastPhase.current && lastPhase.current !== key) {
      if (isNight) setTransition("NIGHT");
      else if (state.phase === "AUBE") setTransition("DAY");
    }
    lastPhase.current = key;
  }, [state]);

  // Sons de fin de partie
  useEffect(() => {
    if (state?.phase !== "FIN") return;
    if (state.winnerTeam === "WOLVES") playWolfHowl();
    else playCheer();
  }, [state?.phase, state?.winnerTeam]);

  useEffect(() => {
    if (state) saveGame(state);
  }, [state]);

  // ── BGM lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    if (!state) return;
    if (state.phase === "FIN") {
      clearBgm(); // Fade to silence on game over
      return;
    }
    startBgm(state.phase.startsWith("NUIT") ? "NIGHT" : "DAY");
  }, [state?.phase]);

  // Always stop BGM when leaving the game screen.
  useEffect(() => () => clearBgm(), []);

  if (!state) return <main className="p-8 text-muted-foreground">Chargement…</main>;

  if (state.phase === "FIN")
    return (
      <GameOver
        state={state}
        onRestart={() => {
          clearGame();
          navigate({ to: "/" });
        }}
      />
    );

  return (
    <main className="mx-auto max-w-lg space-y-5 px-4 py-6 pb-16">
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-2 bg-background/80 px-4 py-2 backdrop-blur">
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          {state.phase.startsWith("NUIT")
            ? `Nuit ${state.night}`
            : `Jour ${state.day}`}
        </span>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <MuteButton />
          <button
            onClick={() => {
              clearGame();
              navigate({ to: "/" });
            }}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary"
          >
            Quitter
          </button>
        </div>
      </header>

      {transition && (
        <PhaseTransition
          kind={transition}
          subtitle={
            transition === "NIGHT"
              ? `Nuit ${state.night} — que tout le monde ferme les yeux`
              : `Jour ${state.day} — le village se réveille`
          }
          onDone={() => setTransition(null)}
        />
      )}

      {victims && (
        <EliminationReveal victims={victims} onClose={() => setVictims(null)} />
      )}

      {state.reveal && (
        <Overlay onClose={() => setState({ ...state, reveal: undefined })}>
          {state.reveal}
        </Overlay>
      )}

      {state.phase === "EVENEMENT_MORT" ? (
        <HunterPanel state={state} onDone={setState} />
      ) : state.captainSuccessionPending ? (
        <CaptainSuccessionPanel state={state} onDone={setState} />
      ) : state.phase === "AUBE" ? (
        <DawnPanel
          state={state}
          settings={settings}
          debateDone={debateDoneDay === state.day}
          onDebateDone={() => setDebateDoneDay(state.day)}
          onChange={setState}
        />
      ) : state.phase === "JOUR_VOTE" ? (
        <VotePanel
          state={state}
          onChange={(next) => {
            if (next.lastEliminated?.length) setVictims(next.lastEliminated);
            setState(next);
          }}
        />
      ) : (
        <NightPanel state={state} onChange={setState} />
      )}

      <section className="surface-card rounded-2xl p-4">
        <h2 className="mb-2 text-xs tracking-widest text-primary uppercase">
          Village ({state.players.filter((p) => p.alive).length} vivants)
        </h2>
        <RoleList players={state.players} revealAll />
      </section>
    </main>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6 backdrop-blur">
      <div className="surface-card animate-rise-in neon-ring max-w-sm space-y-5 rounded-3xl p-6 text-center">
        <p className="text-lg font-semibold">{children}</p>
        <button
          onClick={onClose}
          className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

function RoleList({
  players,
  revealAll,
}: {
  players: Player[];
  revealAll?: boolean;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 text-sm">
      {players.map((p) => (
        <li
          key={p.id}
          className={`rounded-xl border border-border px-3 py-2 ${p.alive ? "" : "opacity-40 line-through"}`}
        >
          <span className="flex items-center gap-1 font-semibold">
            {p.name}
            {p.isCaptain && p.alive && (
              <Crown className="size-3.5 text-accent" aria-label="Capitaine" />
            )}
            {p.isConvertedToWolf && (
              <span
                title="Converti en Loup (info meneur)"
                className="rounded bg-destructive/20 px-1 text-[9px] font-bold text-destructive uppercase"
              >
                Loup
              </span>
            )}
          </span>
          {(revealAll || !p.alive) && (
            <span className="block text-[11px] text-muted-foreground">
              {ROLE_BY_ID[p.originalRoleId ?? effectiveRoleId(p)]?.name}
              {p.isConvertedToWolf && " (converti)"}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function PlayerPicker({
  players,
  selected,
  onToggle,
}: {
  players: Player[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {players.map((p) => (
        <button
          key={p.id}
          onClick={() => onToggle(p.id)}
          className={`relative rounded-xl border px-3 py-3 text-sm transition ${
            selected.includes(p.id)
              ? "neon-ring border-primary bg-primary/15 text-primary"
              : "border-border"
          }`}
        >
          {p.isCaptain && (
            <span
              aria-label="Capitaine"
              className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg"
            >
              <Crown className="size-3.5" />
            </span>
          )}
          {p.name}
        </button>
      ))}
    </div>
  );
}

function NightPanel({
  state,
  onChange,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
}) {
  const step = currentStep(state);
  const [sel, setSel] = useState<string[]>([]);
  const [execute, setExecute] = useState(false);
  const [heal, setHeal] = useState(false);
  const [infect, setInfect] = useState(false);
  const [mute, setMute] = useState<string | null>(null);
  const [editingWord, setEditingWord] = useState(false);
  const [wordDraft, setWordDraft] = useState("");

  useEffect(() => {
    setSel([]);
    setExecute(false);
    setHeal(false);
    setInfect(false);
    setMute(null);
    setEditingWord(false);
    setWordDraft("");
  }, [step?.key]);

  // Wolf-pack SFX: howl whenever a wolf role wakes up
  useEffect(() => {
    if (!step) return;
    const WOLF_ROLES = [
      "loup-garou",
      "loup-noir",
      "loup-blanc",
      "loup-matriarche",
      "loup-bavard",
    ];
    if (WOLF_ROLES.includes(step.roleId)) playWolfHowl();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key]);

  if (!step) {
    return (
      <NarratorCard text="La nuit s'achève sur le village endormi.">
        <button
          onClick={() => onChange(submitStep(state, {}))}
          className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
        >
          Lever le jour
        </button>
      </NarratorCard>
    );
  }

  const actor = state.players.find((p) => p.id === step.actorId)!;
  let candidates = state.players.filter((p) => p.alive);
  if (step.roleId === "loup-blanc")
    candidates = candidates.filter(
      (p) => p.team === "WEREWOLVES" && p.id !== actor.id,
    );
  if (step.roleId === "salvateur")
    candidates = candidates.filter((p) => p.id !== state.round.previousProtectedId);
  if (["voyante", "cupidon", "mime", "enfant-sauvage", "general"].includes(step.roleId))
    candidates = candidates.filter((p) => p.id !== actor.id);

  const toggle = (id: string) =>
    setSel((s) =>
      s.includes(id)
        ? s.filter((x) => x !== id)
        : step.mode === "two"
          ? [...s, id].slice(-2)
          : [id],
    );

  const send = (payload: Parameters<typeof submitStep>[1]) =>
    onChange(submitStep(state, payload));

  const matriarch = state.players.find(
    (p) =>
      p.alive &&
      effectiveRoleId(p) === "loup-matriarche" &&
      !p.disabledNightAbility &&
      !p.powersDisabled,
  );


  return (
    <div className="surface-card animate-rise-in neon-ring overflow-hidden rounded-3xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={roleImage(step.roleId)}
          alt={`Réveil du rôle ${step.title}`}
          width={640}
          height={640}
          loading="lazy"
          className="animate-slow-zoom h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <p className="absolute bottom-3 left-4 text-lg font-black text-primary">
          {step.title}
        </p>
        <div className="absolute right-3 bottom-3">
          <SpeakButton text={step.title} />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-sm text-muted-foreground">
          {actor.name} — {step.prompt}
        </p>

        {step.mode === "word" ? (
          <div className="space-y-4">
            {/* Big reveal card — MJ holds up screen for the Loup Bavard */}
            <div className="neon-ring relative overflow-hidden rounded-3xl border-2 border-primary bg-black/60 p-6 text-center">
              <p className="text-[11px] tracking-[0.3em] text-primary uppercase">
                Mot secret imposé
              </p>
              {editingWord ? (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    autoFocus
                    value={wordDraft}
                    onChange={(e) => setWordDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && wordDraft.trim()) {
                        onChange({ ...state, round: { ...state.round, requiredWord: wordDraft.trim() } });
                        setEditingWord(false);
                      }
                      if (e.key === "Escape") setEditingWord(false);
                    }}
                    className="flex-1 rounded-2xl bg-input px-4 py-3 text-center text-3xl font-black outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nouveau mot…"
                  />
                  <button
                    onClick={() => {
                      if (wordDraft.trim()) {
                        onChange({ ...state, round: { ...state.round, requiredWord: wordDraft.trim() } });
                      }
                      setEditingWord(false);
                    }}
                    className="shrink-0 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingWord(false)}
                    className="shrink-0 rounded-full border border-border p-3 text-muted-foreground"
                    aria-label="Annuler"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-center gap-3">
                  <span className="gradient-text text-6xl font-black leading-tight tracking-wider">
                    {state.round.requiredWord}
                  </span>
                  <button
                    onClick={() => {
                      setWordDraft(state.round.requiredWord ?? "");
                      setEditingWord(true);
                    }}
                    aria-label="Modifier le mot"
                    className="shrink-0 rounded-full border border-primary/40 p-2 text-primary/60 transition hover:border-primary hover:text-primary"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => send({})}
              className="neon-ring w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              Le Loup Bavard a vu son mot
            </button>
          </div>
        ) : step.mode === "wolves" ? (
          <div className="space-y-3">
            <PlayerPicker players={candidates} selected={sel} onToggle={toggle} />
            <button
              disabled={sel.length !== 1}
              onClick={() => send({ targetId: sel[0] })}
              className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40"
            >
              La meute est d'accord
            </button>
            {matriarch && (
              <button
                onClick={() => send({ disagreement: true })}
                className="w-full rounded-full border border-primary py-3 text-sm font-bold text-primary"
              >
                Désaccord — la Matriarche tranche
              </button>
            )}
          </div>
        ) : step.mode === "blackwolf" ? (
          <div className="space-y-3">
            {state.round.attackedId && !actor.abilityUsed && (
              <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={infect}
                  onChange={(e) => setInfect(e.target.checked)}
                />
                Contaminer{" "}
                {state.players.find((p) => p.id === state.round.attackedId)?.name}{" "}
                (1× par partie)
              </label>
            )}
            {state.night >= 2 ? (
              <>
                <p className="text-xs tracking-widest text-primary uppercase">
                  Imposer le silence (optionnel)
                </p>
                <PlayerPicker
                  players={candidates.filter(
                    (p) =>
                      p.id !== actor.id && p.id !== state.round.previousMutedId,
                  )}
                  selected={mute ? [mute] : []}
                  onToggle={(id) => setMute((m) => (m === id ? null : id))}
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Le pouvoir de silence est disponible à partir de la nuit 2.
              </p>
            )}
            <button
              onClick={() => send({ yes: infect, muteId: mute ?? undefined })}
              className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              Valider
            </button>
          </div>
        ) : step.mode === "bear" ? (
          <>
            <div className="space-y-1 rounded-2xl border border-border p-3 text-sm">
              <p className="text-[11px] tracking-widest text-primary uppercase">
                Voisins directs (info Maître du Jeu)
              </p>
              {(() => {
                const { left, right } = bearNeighbors(state, actor.id);
                return [left, right].map((n, idx) =>
                  n ? (
                    <p key={idx} className="text-muted-foreground">
                      {idx === 0 ? "Gauche" : "Droite"} :{" "}
                      <span className="font-semibold text-foreground">{n.name}</span>{" "}
                      — {ROLE_BY_ID[n.originalRoleId ?? effectiveRoleId(n)]?.name}
                      {n.isConvertedToWolf && " (infecté)"}
                    </p>
                  ) : null,
                );
              })()}
            </div>
            <button
            onClick={() => send({})}
            className="neon-ring w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
          >
            L'ours renifle les voisins
          </button>
          </>
        ) : step.mode === "yesno" ? (
          <div className="flex gap-3">
            <button
              onClick={() => send({ yes: true })}
              className="flex-1 rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              Oui
            </button>
            <button
              onClick={() => send({ yes: false })}
              className="flex-1 rounded-full border border-border py-3 font-semibold"
            >
              Non
            </button>
          </div>
        ) : step.mode === "witch" ? (
          <div className="space-y-3">
            {state.round.attackedId && !actor.healUsed && (
              <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={heal}
                  onChange={(e) => setHeal(e.target.checked)}
                />
                Sauver{" "}
                {state.players.find((p) => p.id === state.round.attackedId)?.name}
              </label>
            )}
            {!actor.poisonUsed && (
              <>
                <p className="text-xs tracking-widest text-primary uppercase">
                  Potion de mort (optionnel)
                </p>
                <PlayerPicker players={candidates} selected={sel} onToggle={toggle} />
              </>
            )}
            <button
              onClick={() => send({ healUsed: heal, poisonId: sel[0] })}
              className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              Valider
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <PlayerPicker players={candidates} selected={sel} onToggle={toggle} />
            {step.roleId === "geolier" && (
              <label className="flex items-center gap-3 rounded-xl border border-destructive/50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={execute}
                  onChange={(e) => setExecute(e.target.checked)}
                />
                Exécuter le prisonnier
              </label>
            )}
            <div className="flex gap-3">
              <button
                disabled={step.mode === "two" ? sel.length !== 2 : sel.length !== 1}
                onClick={() =>
                  send({ targetId: sel[0], targetIds: sel, yes: execute })
                }
                className="flex-1 rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40"
              >
                Valider
              </button>
              {step.optional && (
                <button
                  onClick={() => send({})}
                  className="rounded-full border border-border px-5 py-3 text-sm"
                >
                  Passer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DawnPanel({
  state,
  settings,
  debateDone,
  onDebateDone,
  onChange,
}: {
  state: GameState;
  settings: GameSettings | null;
  debateDone: boolean;
  onDebateDone: () => void;
  onChange: (s: GameState) => void;
}) {
  const firstDay = state.day === 1 && !state.voteSkippedOffer;
  const alive = state.players.filter((p) => p.alive);

  // Le débat a lieu chaque jour, avant tout vote (obligatoire le jour 1).
  if (settings?.isDebateTimerEnabled && !debateDone)
    return (
      <NarratorCard
        title={`Débat — Jour ${state.day}`}
        text="Le capitaine ouvre les débats, chaque joueur s'exprime, puis le capitaine conclut."
      >
        {alive.some((p) => p.mutedForDay) && (
          <p className="rounded-xl border border-destructive/50 p-3 text-xs text-muted-foreground">
            Réduit(s) au silence par le Loup Noir :{" "}
            {alive
              .filter((p) => p.mutedForDay)
              .map((p) => p.name)
              .join(", ")}
          </p>
        )}
        <DebateQueue
          players={alive.filter((p) => !p.mutedForDay)}
          seconds={settings.debateTimePerPlayer}
          captainId={state.villageCaptainId}
          onFinish={onDebateDone}
        />
      </NarratorCard>
    );

  return (
    <NarratorCard
      title={`Aube — Jour ${state.day}`}
      text={state.dawnSummary.join(" ")}
    >
      {state.round.requiredWord && (
        <p className="rounded-xl border border-border p-3 text-sm">
          Loup Bavard, ton mot du jour :{" "}
          <span className="font-bold text-primary">{state.round.requiredWord}</span>
        </p>
      )}
      {firstDay ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Villageois, souhaitez-vous procéder au vote dès ce premier jour ? Ce
            matin seulement, le vote est facultatif.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onChange(goToVote(state))}
              className="flex-1 rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              Voter
            </button>
            <button
              onClick={() => onChange(skipVote(state))}
              className="flex-1 rounded-full border border-border py-3 font-semibold"
            >
              Pas de vote
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onChange(goToVote(state))}
          className="neon-ring w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
        >
          Le meneur impose le vote du village
        </button>
      )}
    </NarratorCard>
  );
}

function VotePanel({
  state,
  onChange,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
}) {
  const alive = state.players.filter((p) => p.alive);
  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(alive.map((p) => [p.id, p.baseVotes])),
  );
  const [tie, setTie] = useState<string[]>([]);
  const [judgePick, setJudgePick] = useState<string[]>([]);
  const [revoteRound, setRevoteRound] = useState(0);
  const talkative = state.players.find(
    (p) => p.alive && effectiveRoleId(p) === "loup-bavard",
  );
  const [spoke, setSpoke] = useState(true);
  const judge = state.players.find(
    (p) => p.alive && effectiveRoleId(p) === "juge",
  );

  const resetVotes = () =>
    setVotes(Object.fromEntries(alive.map((p) => [p.id, p.baseVotes])));

  const validate = () => {
    const max = Math.max(...Object.values(votes));
    const top = Object.entries(votes)
      .filter(([, v]) => v === max && max > 0)
      .map(([id]) => id);
    if (top.length === 0) return;
    if (top.length > 1) {
      if (revoteRound >= 1) {
        // Seconde égalité : tous les ex æquo périssent.
        playGavel();
        onChange(eliminateTied(state, top, spoke));
        return;
      }
      if (!judge) {
        // Pas de Juge : revote automatique.
        playGavel();
        setRevoteRound(1);
        resetVotes();
        return;
      }
      playGavel();
      setTie(top);
      return;
    }
    onChange(submitVote(state, top[0], spoke));
  };

  const totalVotesCast = Object.values(votes).reduce((a, b) => a + b, 0);
  const voteLimit = alive.length + 1; // +1 : le Capitaine pèse 2 voix

  return (
    <NarratorCard
      title={`Vote du village — Jour ${state.day}${revoteRound ? " (revote)" : ""}`}
      text="Le village doit désigner un condamné. Comptez les voix : au moins un joueur doit être éliminé."
    >
      {/* Running vote tally */}
      <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          Voix distribuées
        </span>
        <span className={`font-black tabular-nums ${totalVotesCast > voteLimit ? "text-destructive" : totalVotesCast === voteLimit ? "text-primary" : "text-foreground"}`}>
          {totalVotesCast} / {voteLimit}
        </span>
      </div>

      <ul className="space-y-2">
        {alive.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
          >
            <span className="flex flex-wrap items-center gap-x-2">
              {p.name}
              {p.isCaptain && (
                <Crown className="size-3.5 text-accent" aria-label="Capitaine" />
              )}
              {p.voteWeight === 2 && (
                <span className="text-[10px] text-primary uppercase">
                  Capitaine ×2
                </span>
              )}
              {!p.canVote && (
                <span className="text-[10px] text-muted-foreground uppercase">
                  ne vote pas
                </span>
              )}
              {p.immuneToDayVote && (
                <span className="text-[10px] text-muted-foreground uppercase">
                  immunisé
                </span>
              )}
            </span>
            <span className="flex items-center gap-3">
              <button
                aria-label={`Retirer une voix à ${p.name}`}
                onClick={() => {
                  playVoteTick();
                  setVotes((v) => ({ ...v, [p.id]: Math.max(0, v[p.id] - 1) }));
                }}
                className="size-7 rounded-full border border-border"
              >
                −
              </button>
              <b className="w-5 text-center">{votes[p.id]}</b>
              <button
                aria-label={`Ajouter une voix à ${p.name}`}
                onClick={() => {
                  playVoteTick();
                  setVotes((v) => ({ ...v, [p.id]: v[p.id] + 1 }));
                }}
                className="size-7 rounded-full bg-primary text-primary-foreground"
              >
                +
              </button>
            </span>
          </li>
        ))}
      </ul>

      {talkative && (
        <div className="space-y-2 rounded-xl border border-primary/40 p-3 text-sm">
          <p className="text-[11px] tracking-widest text-primary uppercase">
            Vérification — Loup Bavard
          </p>
          <p>
            A-t-il prononcé son mot
            {state.round.requiredWord ? ` « ${state.round.requiredWord} »` : ""} ?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSpoke(true)}
              className={`flex-1 rounded-full py-2 text-xs font-bold ${spoke ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
            >
              Oui
            </button>
            <button
              onClick={() => setSpoke(false)}
              className={`flex-1 rounded-full py-2 text-xs font-bold ${!spoke ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
            >
              Non
            </button>
          </div>
        </div>
      )}

      {tie.length > 1 ? (
        <div className="space-y-3 rounded-2xl border border-primary/40 p-4">
          <p className="text-sm text-primary">
            Égalité : le Juge arbitre. Il désigne un ou plusieurs ex æquo à
            éliminer, ou ordonne un revote.
          </p>
          {tie.map((id) => {
            const picked = judgePick.includes(id);
            return (
              <button
                key={id}
                onClick={() =>
                  setJudgePick((s) =>
                    picked ? s.filter((x) => x !== id) : [...s, id],
                  )
                }
                className={`w-full rounded-full py-3 text-sm ${picked ? "bg-primary font-bold text-primary-foreground" : "border border-primary"}`}
              >
                {state.players.find((p) => p.id === id)?.name}
              </button>
            );
          })}
          <button
            disabled={judgePick.length === 0}
            onClick={() =>
              onChange(
                judgePick.length === 1
                  ? submitVote(state, judgePick[0], spoke)
                  : eliminateTied(state, judgePick, spoke),
              )
            }
            className="neon-ring w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40"
          >
            Exécuter la sentence du Juge
          </button>
          <button
            onClick={() => {
              setTie([]);
              setJudgePick([]);
              setRevoteRound(1);
              resetVotes();
            }}
            className="w-full rounded-full border border-primary py-3 text-sm font-bold text-primary"
          >
            Ordonner un revote
          </button>
          <p className="text-xs text-muted-foreground">
            En cas de seconde égalité après revote, tous les ex æquo sont
            éliminés.
          </p>
        </div>
      ) : (
        <button
          onClick={validate}
          className="neon-ring w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
        >
          Valider l'exécution
        </button>
      )}
    </NarratorCard>
  );
}

function GameOver({
  state,
  onRestart,
}: {
  state: GameState;
  onRestart: () => void;
}) {
  const wolves = state.winnerTeam === "WOLVES";
  return (
    <main className="mx-auto max-w-lg space-y-5 px-4 py-8">
      <div
        className={`surface-card animate-rise-in neon-ring space-y-2 rounded-3xl p-6 text-center ${
          wolves ? "border-destructive/50" : ""
        }`}
      >
        <p className="text-5xl">{wolves ? "🐺" : "🎉"}</p>
        <h1 className="neon-text text-2xl font-black">Fin de la partie</h1>
        <p className="text-sm text-muted-foreground">
          {state.winner ?? "La partie est terminée."}
        </p>
      </div>

      <section className="surface-card space-y-3 rounded-3xl p-4">
        <h2 className="text-xs tracking-[0.3em] text-primary uppercase">
          Récapitulatif
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] tracking-widest text-muted-foreground uppercase">
                <th className="py-2">Joueur</th>
                <th className="py-2">Rôle</th>
                <th className="py-2">Camp</th>
                <th className="py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {state.players.map((p) => {
                const role = ROLE_BY_ID[p.originalRoleId ?? effectiveRoleId(p)];
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="flex items-center gap-1 py-2 font-semibold">
                      {p.name}
                      {p.isCaptain && <Crown className="size-3.5 text-accent" />}
                    </td>
                    <td className="py-2 text-muted-foreground">{role?.name}</td>
                    <td className="py-2 text-muted-foreground">
                      {TEAM_LABEL[p.team]}
                      {p.isConvertedToWolf && " ⟲"}
                    </td>
                    <td className="py-2">
                      {p.alive ? (
                        <span className="text-primary">Vivant</span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <Skull className="size-3.5" /> Mort
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <button
        onClick={onRestart}
        className="neon-ring w-full rounded-full bg-primary py-4 font-bold text-primary-foreground"
      >
        Nouvelle partie
      </button>
    </main>
  );
}

function CaptainSuccessionPanel({
  state,
  onDone,
}: {
  state: GameState;
  onDone: (s: GameState) => void;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const dead = state.players.find((p) => p.id === state.captainSuccessionPending);
  const candidates = state.players.filter((p) => p.alive);
  return (
    <NarratorCard
      title="Succession du Capitaine"
      text={`${dead?.name ?? "Le capitaine"} tombe. Avant de partir, il désigne lui-même son successeur : il n'y a pas de nouveau vote.`}
    >
      <PlayerPicker
        players={candidates}
        selected={sel}
        onToggle={(id) => setSel([id])}
      />
      <button
        disabled={sel.length !== 1}
        onClick={() => onDone(assignCaptain(state, sel[0]))}
        className="neon-ring w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40"
      >
        Transmettre le capitanat
      </button>
    </NarratorCard>
  );
}

function HunterPanel({
  state,
  onDone,
}: {
  state: GameState;
  onDone: (s: GameState) => void;
}) {
  const [sel, setSel] = useState<string[]>([]);
  const candidates = state.players.filter(
    (p) => p.alive && p.id !== state.hunterPending,
  );
  return (
    <NarratorCard
      title="Dernier souffle du Chasseur"
      text="Le Chasseur s'effondre, mais son fusil parle une dernière fois."
    >
      <PlayerPicker
        players={candidates}
        selected={sel}
        onToggle={(id) => setSel([id])}
      />
      <button
        disabled={sel.length !== 1}
        onClick={() => onDone(resolveHunter(state, sel[0]))}
        className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40"
      >
        Tirer
      </button>
    </NarratorCard>
  );
}