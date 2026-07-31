import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Crown, Pencil, Skull, Trophy, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MuteButton } from "@/components/MuteButton";
import { ROLE_BY_ID, TEAM_LABEL, roleImage } from "@/data/roles";
import { NarratorCard } from "@/components/NarratorCard";
import { PhaseTransition } from "@/components/PhaseTransition";
import { SpeakButton } from "@/components/SpeakButton";
import { DebateQueue } from "@/components/DebateQueue";
import { EliminationReveal } from "@/components/EliminationReveal";
import { useI18n } from "@/lib/i18n";
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

/** One round of village voting recorded for post-game analytics. */
interface VoteRecord {
  day: number;
  votes: { id: string; name: string; count: number }[];
  eliminated: { id: string; name: string; roleId: string; team: string }[];
  isRevote: boolean;
}

/** Score-based MVP: survival > captain > winning-team alignment. */
function computeMvp(
  players: Player[],
  winnerTeam?: string,
): { player: Player; score: number } {
  const results = players.map((p) => {
    let score = 0;
    if (p.alive) score += 5;
    if (p.isCaptain) score += 2;
    const isWolf = p.team === "WEREWOLVES" || !!p.isConvertedToWolf;
    const wins =
      (winnerTeam === "WOLVES" && isWolf) ||
      (winnerTeam === "VILLAGE" && !isWolf && p.team === "VILLAGEOIS") ||
      (winnerTeam === "LOVERS" && p.team === "LOVERS") ||
      (winnerTeam === "PIPER" && effectiveRoleId(p) === "joueur-de-flute");
    if (wins) score += 3;
    return { player: p, score };
  });
  return results.sort((a, b) => b.score - a.score)[0]!;
}

function GamePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [state, setState] = useState<GameState | null>(null);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [transition, setTransition] = useState<"NIGHT" | "DAY" | null>("NIGHT");
  const [victims, setVictims] = useState<
    { id: string; name: string; roleId: string }[] | null
  >(null);
  const [debateDoneDay, setDebateDoneDay] = useState(0);
  const [voteHistory, setVoteHistory] = useState<VoteRecord[]>([]);
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

  // Phase transition cards
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

  // End-of-game SFX
  useEffect(() => {
    if (state?.phase !== "FIN") return;
    if (state.winnerTeam === "WOLVES") playWolfHowl();
    else playCheer();
  }, [state?.phase, state?.winnerTeam]);

  useEffect(() => {
    if (state) saveGame(state);
  }, [state]);

  // BGM lifecycle
  useEffect(() => {
    if (!state) return;
    if (state.phase === "FIN") { clearBgm(); return; }
    startBgm(state.phase.startsWith("NUIT") ? "NIGHT" : "DAY");
  }, [state?.phase]);

  useEffect(() => () => clearBgm(), []);

  if (!state)
    return <main className="p-8 text-muted-foreground">{t("loading")}</main>;

  if (state.phase === "FIN")
    return (
      <GameOver
        state={state}
        voteHistory={voteHistory}
        onRestart={() => { clearGame(); navigate({ to: "/" }); }}
      />
    );

  const isNight = state.phase.startsWith("NUIT");
  const phaseLabel = isNight
    ? t("nightN", { n: state.night })
    : t("dayN", { n: state.day });

  return (
    <main className="mx-auto max-w-lg space-y-5 px-4 py-6 pb-16">
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-2 bg-background/80 px-4 py-2 backdrop-blur">
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          {phaseLabel}
        </span>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <MuteButton />
          <button
            onClick={() => { clearGame(); navigate({ to: "/" }); }}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary"
          >
            {t("quit")}
          </button>
        </div>
      </header>

      {transition && (
        <PhaseTransition
          kind={transition}
          subtitle={
            transition === "NIGHT"
              ? t("nightSubtitle", { n: state.night })
              : t("daySubtitle", { n: state.day })
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
          onVoteRecord={(r) => setVoteHistory((h) => [...h, r])}
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
          {t("village", { n: state.players.filter((p) => p.alive).length })}
        </h2>
        <RoleList players={state.players} revealAll />
      </section>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6 backdrop-blur">
      <div className="surface-card animate-rise-in neon-ring max-w-sm space-y-5 rounded-3xl p-6 text-center">
        <p className="text-lg font-semibold">{children}</p>
        <button
          onClick={onClose}
          className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
        >
          {t("continue")}
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
  const { t } = useI18n();
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
              <Crown className="size-3.5 text-accent" aria-label={t("captain")} />
            )}
            {p.isConvertedToWolf && (
              <span
                title={t("convertedInfo")}
                className="rounded bg-destructive/20 px-1 text-[9px] font-bold text-destructive uppercase"
              >
                {t("wolfTag")}
              </span>
            )}
          </span>
          {(revealAll || !p.alive) && (
            <span className="block text-[11px] text-muted-foreground">
              {ROLE_BY_ID[p.originalRoleId ?? effectiveRoleId(p)]?.name}
              {p.isConvertedToWolf && t("converted")}
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
  const { t } = useI18n();
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
              aria-label={t("captain")}
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

// ─── Night panel ──────────────────────────────────────────────────────────────

function NightPanel({
  state,
  onChange,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
}) {
  const { t, prompt } = useI18n();
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

  // Wolf-pack SFX
  useEffect(() => {
    if (!step) return;
    const WOLF_ROLES = ["loup-garou", "loup-noir", "loup-blanc", "loup-matriarche", "loup-bavard"];
    if (WOLF_ROLES.includes(step.roleId)) playWolfHowl();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.key]);

  if (!step) {
    return (
      <NarratorCard text={t("nightEnds")}>
        <button
          onClick={() => onChange(submitStep(state, {}))}
          className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
        >
          {t("raiseDay")}
        </button>
      </NarratorCard>
    );
  }

  const actor = state.players.find((p) => p.id === step.actorId)!;
  let candidates = state.players.filter((p) => p.alive);
  if (step.roleId === "loup-blanc")
    candidates = candidates.filter((p) => p.team === "WEREWOLVES" && p.id !== actor.id);
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

  // Salvateur + Sorcière interaction: if salvateur already protects the attacked player,
  // the witch's heal potion is unnecessary.
  const isAttackedPlayerSaved =
    step.mode === "witch" &&
    state.round.attackedId != null &&
    state.round.attackedId === state.round.protectedId;

  const attackedPlayerName = state.players.find((p) => p.id === state.round.attackedId)?.name;

  const stepPrompt = prompt(step.roleId) || step.prompt;

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
          {actor.name} — {stepPrompt}
        </p>

        {step.mode === "word" ? (
          <div className="space-y-4">
            <div className="neon-ring relative overflow-hidden rounded-3xl border-2 border-primary bg-black/60 p-6 text-center">
              <p className="text-[11px] tracking-[0.3em] text-primary uppercase">
                {t("secretWordTitle")}
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
                      if (wordDraft.trim())
                        onChange({ ...state, round: { ...state.round, requiredWord: wordDraft.trim() } });
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
                    aria-label={t("editWord")}
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
              {t("bavardSeen")}
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
              {t("packAgrees")}
            </button>
            {matriarch && (
              <button
                onClick={() => send({ disagreement: true })}
                className="w-full rounded-full border border-primary py-3 text-sm font-bold text-primary"
              >
                {t("disagreement")}
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
                {t("infectPlayer", {
                  name: state.players.find((p) => p.id === state.round.attackedId)?.name ?? "",
                })}
              </label>
            )}
            {state.night >= 2 ? (
              <>
                <p className="text-xs tracking-widest text-primary uppercase">
                  {t("muteTitle")}
                </p>
                <PlayerPicker
                  players={candidates.filter(
                    (p) => p.id !== actor.id && p.id !== state.round.previousMutedId,
                  )}
                  selected={mute ? [mute] : []}
                  onToggle={(id) => setMute((m) => (m === id ? null : id))}
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{t("muteUnavailable")}</p>
            )}
            <button
              onClick={() => send({ yes: infect, muteId: mute ?? undefined })}
              className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              {t("validate")}
            </button>
          </div>
        ) : step.mode === "bear" ? (
          <>
            <div className="space-y-1 rounded-2xl border border-border p-3 text-sm">
              <p className="text-[11px] tracking-widest text-primary uppercase">
                {t("bearNeighbors")}
              </p>
              {(() => {
                const { left, right } = bearNeighbors(state, actor.id);
                return [left, right].map((n, idx) =>
                  n ? (
                    <p key={idx} className="text-muted-foreground">
                      {idx === 0 ? t("left") : t("right")} :{" "}
                      <span className="font-semibold text-foreground">{n.name}</span>{" "}
                      — {ROLE_BY_ID[n.originalRoleId ?? effectiveRoleId(n)]?.name}
                      {n.isConvertedToWolf && t("infected")}
                    </p>
                  ) : null,
                );
              })()}
            </div>
            <button
              onClick={() => send({})}
              className="neon-ring w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              {t("bearSniff")}
            </button>
          </>
        ) : step.mode === "yesno" ? (
          <div className="flex gap-3">
            <button
              onClick={() => send({ yes: true })}
              className="flex-1 rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              {t("yes")}
            </button>
            <button
              onClick={() => send({ yes: false })}
              className="flex-1 rounded-full border border-border py-3 font-semibold"
            >
              {t("no")}
            </button>
          </div>
        ) : step.mode === "witch" ? (
          <div className="space-y-3">
            {isAttackedPlayerSaved ? (
              /* Salvateur already saved the victim — hide heal potion */
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                🛡️ {t("witchTargetProtected")}
              </div>
            ) : (
              state.round.attackedId && !actor.healUsed && (
                <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={heal}
                    onChange={(e) => setHeal(e.target.checked)}
                  />
                  {t("healSave", { name: attackedPlayerName ?? "" })}
                </label>
              )
            )}
            {!actor.poisonUsed && (
              <>
                <p className="text-xs tracking-widest text-primary uppercase">
                  {t("poisonPotion")}
                </p>
                <PlayerPicker players={candidates} selected={sel} onToggle={toggle} />
              </>
            )}
            <button
              onClick={() => send({ healUsed: isAttackedPlayerSaved ? false : heal, poisonId: sel[0] })}
              className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              {t("validate")}
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
                {t("execPrisoner")}
              </label>
            )}
            <div className="flex gap-3">
              <button
                disabled={step.mode === "two" ? sel.length !== 2 : sel.length !== 1}
                onClick={() => send({ targetId: sel[0], targetIds: sel, yes: execute })}
                className="flex-1 rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40"
              >
                {t("validate")}
              </button>
              {step.optional && (
                <button
                  onClick={() => send({})}
                  className="rounded-full border border-border px-5 py-3 text-sm"
                >
                  {t("skip")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dawn panel ───────────────────────────────────────────────────────────────

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
  const { t } = useI18n();
  const firstDay = state.day === 1 && !state.voteSkippedOffer;
  const alive = state.players.filter((p) => p.alive);

  if (settings?.isDebateTimerEnabled && !debateDone)
    return (
      <NarratorCard
        title={t("debateTitle", { n: state.day })}
        text={t("debateText")}
      >
        {alive.some((p) => p.mutedForDay) && (
          <p className="rounded-xl border border-destructive/50 p-3 text-xs text-muted-foreground">
            {t("mutedBy", {
              names: alive
                .filter((p) => p.mutedForDay)
                .map((p) => p.name)
                .join(", "),
            })}
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
      title={t("dawnTitle", { n: state.day })}
      text={state.dawnSummary.join(" ")}
    >
      {state.round.requiredWord && (
        <p className="rounded-xl border border-border p-3 text-sm">
          {t("bavardWordOfDay")}{" "}
          <span className="font-bold text-primary">{state.round.requiredWord}</span>
        </p>
      )}
      {firstDay ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("firstDayVoteQuestion")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onChange(goToVote(state))}
              className="flex-1 rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              {t("vote")}
            </button>
            <button
              onClick={() => onChange(skipVote(state))}
              className="flex-1 rounded-full border border-border py-3 font-semibold"
            >
              {t("noVote")}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onChange(goToVote(state))}
          className="neon-ring w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
        >
          {t("forceVote")}
        </button>
      )}
    </NarratorCard>
  );
}

// ─── Vote panel ───────────────────────────────────────────────────────────────

function VotePanel({
  state,
  onChange,
  onVoteRecord,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
  onVoteRecord?: (r: VoteRecord) => void;
}) {
  const { t } = useI18n();
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
  // Feature 2: hide Loup Bavard word-check on Day 1 (they were inactive Night 1)
  const showTalkativeCheck = !!talkative && state.day > 1;

  const [spoke, setSpoke] = useState(true);
  const judge = state.players.find(
    (p) => p.alive && effectiveRoleId(p) === "juge",
  );

  const resetVotes = () =>
    setVotes(Object.fromEntries(alive.map((p) => [p.id, p.baseVotes])));

  /** Build a VoteRecord snapshot from current vote state. */
  const buildRecord = (eliminatedIds: string[], isRevote: boolean): VoteRecord => ({
    day: state.day,
    votes: alive
      .map((p) => ({ id: p.id, name: p.name, count: votes[p.id] ?? 0 }))
      .filter((v) => v.count > 0),
    eliminated: eliminatedIds.map((id) => {
      const p = state.players.find((x) => x.id === id)!;
      return { id, name: p.name, roleId: effectiveRoleId(p), team: p.team };
    }),
    isRevote,
  });

  const validate = () => {
    const max = Math.max(...Object.values(votes));
    const top = Object.entries(votes)
      .filter(([, v]) => v === max && max > 0)
      .map(([id]) => id);
    if (top.length === 0) return;
    if (top.length > 1) {
      if (revoteRound >= 1) {
        // Second tie: eliminate all tied players
        playGavel();
        onVoteRecord?.(buildRecord(top, true));
        onChange(eliminateTied(state, top, spoke));
        return;
      }
      if (!judge) {
        // No Judge: automatic revote
        playGavel();
        setRevoteRound(1);
        resetVotes();
        return;
      }
      playGavel();
      setTie(top);
      return;
    }
    onVoteRecord?.(buildRecord(top, revoteRound > 0));
    onChange(submitVote(state, top[0], spoke));
  };

  const totalVotesCast = Object.values(votes).reduce((a, b) => a + b, 0);
  const voteLimit = alive.length + 1;

  return (
    <NarratorCard
      title={`${t("voteTitle", { n: state.day })}${revoteRound ? t("revoteSuffix") : ""}`}
      text={t("voteText")}
    >
      {/* Running tally */}
      <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          {t("voteTotal", { c: totalVotesCast, t: voteLimit })}
        </span>
        <span
          className={`font-black tabular-nums ${
            totalVotesCast > voteLimit
              ? "text-destructive"
              : totalVotesCast === voteLimit
                ? "text-primary"
                : "text-foreground"
          }`}
        >
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
                <Crown className="size-3.5 text-accent" aria-label={t("captain")} />
              )}
              {p.voteWeight === 2 && (
                <span className="text-[10px] text-primary uppercase">{t("captainX2")}</span>
              )}
              {!p.canVote && (
                <span className="text-[10px] text-muted-foreground uppercase">{t("cannotVote")}</span>
              )}
              {p.immuneToDayVote && (
                <span className="text-[10px] text-muted-foreground uppercase">{t("immune")}</span>
              )}
            </span>
            <span className="flex items-center gap-3">
              <button
                aria-label={t("removeVote", { name: p.name })}
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
                aria-label={t("addVote", { name: p.name })}
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

      {/* Feature 2: Loup Bavard word check only from Day 2 */}
      {showTalkativeCheck ? (
        <div className="space-y-2 rounded-xl border border-primary/40 p-3 text-sm">
          <p className="text-[11px] tracking-widest text-primary uppercase">
            {t("bavardCheck")}
          </p>
          <p>
            {t("bavardAsk", {
              word: state.round.requiredWord ? `« ${state.round.requiredWord} »` : "—",
            })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSpoke(true)}
              className={`flex-1 rounded-full py-2 text-xs font-bold ${spoke ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
            >
              {t("yes")}
            </button>
            <button
              onClick={() => setSpoke(false)}
              className={`flex-1 rounded-full py-2 text-xs font-bold ${!spoke ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
            >
              {t("no")}
            </button>
          </div>
        </div>
      ) : talkative && state.day === 1 ? (
        /* Day 1: Loup Bavard was inactive night 1, no word to check */
        <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
          {t("bavardInactiveDay1")}
        </div>
      ) : null}

      {/* Judge tie-breaker or validate button */}
      {tie.length > 1 ? (
        <div className="space-y-3 rounded-2xl border border-primary/40 p-4">
          <p className="text-sm text-primary">{t("tieJudge")}</p>
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
            onClick={() => {
              const record = buildRecord(judgePick, revoteRound > 0);
              onVoteRecord?.(record);
              onChange(
                judgePick.length === 1
                  ? submitVote(state, judgePick[0], spoke)
                  : eliminateTied(state, judgePick, spoke),
              );
            }}
            className="neon-ring w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40"
          >
            {t("judgeExecute")}
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
            {t("orderRevote")}
          </button>
          <p className="text-xs text-muted-foreground">{t("tieNote")}</p>
        </div>
      ) : (
        <button
          onClick={validate}
          className="neon-ring w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
        >
          {t("validateExec")}
        </button>
      )}
    </NarratorCard>
  );
}

// ─── Game over / Bilan de Partie ──────────────────────────────────────────────

function GameOver({
  state,
  voteHistory,
  onRestart,
}: {
  state: GameState;
  voteHistory: VoteRecord[];
  onRestart: () => void;
}) {
  const { t } = useI18n();
  const wolves = state.winnerTeam === "WOLVES";
  const survivors = state.players.filter((p) => p.alive).length;
  const duration = state.day ?? 1;

  // MVP
  const { player: mvp, score: mvpScore } = computeMvp(state.players, state.winnerTeam);

  // Strategic domination: did the village mostly execute wolves, or villagers?
  const allEliminated = voteHistory.flatMap((r) => r.eliminated);
  const wolfElims = allEliminated.filter(
    (e) => e.team === "WEREWOLVES",
  ).length;
  const villageElims = allEliminated.filter(
    (e) => e.team !== "WEREWOLVES",
  ).length;
  const totalElims = wolfElims + villageElims;
  const villagePct = totalElims > 0 ? Math.round((wolfElims / totalElims) * 100) : 0;
  const wolfPct = totalElims > 0 ? Math.round((villageElims / totalElims) * 100) : 0;

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-8">
      {/* ── Winner banner ── */}
      <div
        className={`surface-card animate-rise-in neon-ring space-y-2 rounded-3xl p-6 text-center ${
          wolves ? "border-destructive/50" : ""
        }`}
      >
        <p className="text-5xl">{wolves ? "🐺" : "🎉"}</p>
        <h1 className="neon-text text-2xl font-black">{t("gameOver")}</h1>
        <p className="text-sm text-muted-foreground">
          {state.winner ?? t("gameOverFallback")}
        </p>
        <div className="flex justify-center gap-4 pt-1 text-xs text-muted-foreground">
          <span>{t("bilanDuration", { d: duration })}</span>
          <span>·</span>
          <span>{t("bilanSurvivors", { n: survivors })}</span>
        </div>
      </div>

      {/* ── MVP card ── */}
      {mvp && (
        <div className="surface-card animate-rise-in rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="size-4 text-gold" />
            <p className="text-[11px] tracking-[0.3em] text-gold uppercase">{t("bilanMvp")}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="mvp-shimmer-text text-xl font-black">{mvp.name}</p>
              <p className="text-xs text-muted-foreground">
                {ROLE_BY_ID[mvp.originalRoleId ?? effectiveRoleId(mvp)]?.name}
                {mvp.isCaptain && " · "}
                {mvp.isCaptain && <span className="text-accent">{t("captain")}</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gold">
                {t("bilanMvpScore", { n: mvpScore })}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {mvp.alive ? t("statusAlive") : t("statusDead")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Strategic analytics ── */}
      {totalElims > 0 && (
        <div className="surface-card animate-rise-in rounded-3xl p-4 space-y-3">
          <p className="text-[11px] tracking-[0.3em] text-primary uppercase">
            {t("bilanTeamDomination")}
          </p>
          {/* Village bar: % of wolf-team players correctly eliminated */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("bilanVillageCtrl", { pct: villagePct })}</span>
              <span className="font-bold text-foreground">{villagePct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-input">
              <div
                className="animate-bar-fill h-full rounded-full bg-primary"
                style={{ "--bar-w": `${villagePct}%` } as React.CSSProperties}
              />
            </div>
          </div>
          {/* Wolf bar: % of village-team players incorrectly eliminated */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("bilanWolfCtrl", { pct: wolfPct })}</span>
              <span className="font-bold text-foreground">{wolfPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-input">
              <div
                className="animate-bar-fill h-full rounded-full bg-destructive"
                style={{ "--bar-w": `${wolfPct}%` } as React.CSSProperties}
              />
            </div>
          </div>
          {villagePct === wolfPct && (
            <p className="text-xs text-muted-foreground text-center">{t("bilanBalanced")}</p>
          )}
        </div>
      )}

      {/* ── Vote history ── */}
      <div className="surface-card animate-rise-in rounded-3xl p-4 space-y-3">
        <p className="text-[11px] tracking-[0.3em] text-primary uppercase">
          {t("bilanVoteHistory")}
        </p>
        {voteHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("bilanNoVotes")}</p>
        ) : (
          <div className="space-y-3">
            {voteHistory.map((record, idx) => {
              const dayLabel = `${t("bilanDayVote", { n: record.day })}${record.isRevote ? t("bilanRevoteSuffix") : ""}`;
              const elimNames = record.eliminated.map((e) => e.name).join(", ");
              const topVotes = [...record.votes].sort((a, b) => b.count - a.count).slice(0, 3);
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border p-3 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{dayLabel}</span>
                    <span className={`font-semibold ${record.eliminated.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {record.eliminated.length > 0
                        ? t("bilanElim", { names: elimNames })
                        : t("bilanNobodyElim")}
                    </span>
                  </div>
                  {/* Top vote recipients */}
                  {topVotes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {topVotes.map((v) => (
                        <span
                          key={v.id}
                          className="rounded-full bg-input px-2 py-0.5 text-muted-foreground"
                        >
                          {v.name} ×{v.count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Player recap table ── */}
      <section className="surface-card space-y-3 rounded-3xl p-4">
        <h2 className="text-xs tracking-[0.3em] text-primary uppercase">{t("recap")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] tracking-widest text-muted-foreground uppercase">
                <th className="py-2">{t("colPlayer")}</th>
                <th className="py-2">{t("colRole")}</th>
                <th className="py-2">{t("colTeam")}</th>
                <th className="py-2">{t("colStatus")}</th>
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
                        <span className="text-primary">{t("statusAlive")}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <Skull className="size-3.5" /> {t("statusDead")}
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
        {t("newGame")}
      </button>
    </main>
  );
}

// ─── Captain succession ───────────────────────────────────────────────────────

function CaptainSuccessionPanel({
  state,
  onDone,
}: {
  state: GameState;
  onDone: (s: GameState) => void;
}) {
  const { t } = useI18n();
  const [sel, setSel] = useState<string[]>([]);
  const dead = state.players.find((p) => p.id === state.captainSuccessionPending);
  const candidates = state.players.filter((p) => p.alive);
  return (
    <NarratorCard
      title={t("captainSuccession")}
      text={t("captainSuccessionText", { name: dead?.name ?? t("captain") })}
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
        {t("transmit")}
      </button>
    </NarratorCard>
  );
}

// ─── Hunter panel ─────────────────────────────────────────────────────────────

function HunterPanel({
  state,
  onDone,
}: {
  state: GameState;
  onDone: (s: GameState) => void;
}) {
  const { t } = useI18n();
  const [sel, setSel] = useState<string[]>([]);
  const candidates = state.players.filter(
    (p) => p.alive && p.id !== state.hunterPending,
  );
  return (
    <NarratorCard
      title={t("hunterTitle")}
      text={t("hunterText")}
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
        {t("shoot")}
      </button>
    </NarratorCard>
  );
}
