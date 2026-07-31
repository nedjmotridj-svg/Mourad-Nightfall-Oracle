import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ROLE_BY_ID, roleImage } from "@/data/roles";
import { TopBar } from "@/components/TopBar";
import { useI18n } from "@/lib/i18n";
import { NarratorCard } from "@/components/NarratorCard";
import { clearGame, loadSetup, saveSetup, type SetupData } from "@/lib/session";

const TITLE = "Distribution des rôles — Nightfall Oracle";
const DESC =
  "Le sort distribue les cartes au hasard, joueur après joueur, avant de rendre la parole au meneur du jeu.";

export const Route = createFileRoute("/distribution")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DistributionPage,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DistributionPage() {
  const navigate = useNavigate();
  const { t, role: tr, team } = useI18n();
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [captain, setCaptain] = useState<string | undefined>(undefined);

  useEffect(() => {
    const s = loadSetup();
    if (!s?.players?.length) {
      navigate({ to: "/setup" });
      return;
    }
    // Distribution totalement aléatoire : rôles ET ordre de passage mélangés.
    const roles = shuffle(s.players.map((p) => p.roleId));
    const players = shuffle(
      s.players.map((p, i) => ({ name: p.name, roleId: roles[i] })),
    );
    const next = { players };
    saveSetup(next);
    clearGame();
    setSetup(next);
  }, [navigate]);

  const player = setup?.players[index];
  const role = useMemo(
    () => (player ? ROLE_BY_ID[player.roleId] : undefined),
    [player],
  );
  const done = !!setup && index >= setup.players.length;
  const captainCandidates = (setup?.players ?? []).filter(
    (p) => p.roleId !== "general",
  );

  if (!setup)
    return <main className="p-8 text-muted-foreground">{t("distributing")}</main>;

  if (done)
    return (
      <main className="mx-auto max-w-lg space-y-5 px-4 py-8">
        <TopBar />
        <h1 className="neon-text text-center text-2xl font-black">
          {t("handoverTitle")}
        </h1>
        <div className="animate-float-soft">
          <NarratorCard
            title={t("narratorTitle")}
            text={t("handoverText")}
          >
            <div className="space-y-3 rounded-2xl border border-border p-4 text-left">
              <p className="text-xs tracking-[0.3em] text-primary uppercase">
                {t("captainElection")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("captainElectionDesc")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {captainCandidates.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setCaptain(p.name)}
                    className={`rounded-xl border px-3 py-3 text-sm transition ${
                      captain === p.name
                        ? "neon-ring border-primary bg-primary/15 text-primary"
                        : "border-border"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setCaptain(
                    captainCandidates.length
                      ? captainCandidates[
                          Math.floor(Math.random() * captainCandidates.length)
                        ].name
                      : undefined,
                  )
                }
                className="neon-ring w-full rounded-full border border-primary py-3 text-sm font-bold text-primary"
              >
                {t("randomSelect")}
              </button>
              <button
                onClick={() => setCaptain(undefined)}
                className="text-xs text-muted-foreground underline"
              >
                {t("noCaptain")}
              </button>
            </div>
            <button
              onClick={() => {
                saveSetup({ ...setup!, villageCaptainId: captain });
                navigate({ to: "/game" });
              }}
              className="neon-ring animate-pulse-glow w-full rounded-full bg-primary py-4 font-bold text-primary-foreground"
            >
              {t("startGame")}
            </button>
          </NarratorCard>
        </div>
      </main>
    );

  return (
    <main className="mx-auto max-w-lg space-y-5 px-4 py-4">
      <TopBar />
      <p className="text-center text-xs tracking-[0.3em] text-muted-foreground uppercase">
        {t("playerXofY", { i: index + 1, n: setup.players.length })}
      </p>
      <h1 className="neon-text text-center text-2xl font-black">{player!.name}</h1>

      {!revealed ? (
        <div className="surface-card animate-rise-in neon-ring space-y-5 rounded-3xl p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("passPhoneTo", { name: player!.name })}
          </p>
          <button
            onClick={() => setRevealed(true)}
            className="neon-ring w-full rounded-full bg-primary py-4 font-bold text-primary-foreground"
          >
            {t("discoverRole")}
          </button>
        </div>
      ) : (
        <div className="surface-card animate-rise-in neon-ring overflow-hidden rounded-3xl">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={roleImage(role!.id)}
              alt={tr(role!.id).name}
              className="animate-slow-zoom h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          </div>
          <div className="space-y-3 p-5">
            <h2 className="text-xl font-black">{tr(role!.id).name}</h2>
            <p className="text-[11px] tracking-widest text-primary uppercase">
              {team(role!.team)}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tr(role!.id).description}
            </p>
            <p className="text-sm leading-relaxed">
              <span className="font-bold text-primary">{t("powerLabel")}</span>
              {tr(role!.id).power}
            </p>
            <button
              onClick={() => {
                setRevealed(false);
                setIndex((i) => i + 1);
              }}
              className="neon-ring w-full rounded-full bg-primary py-3 font-bold text-primary-foreground"
            >
              {t("memorized")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
