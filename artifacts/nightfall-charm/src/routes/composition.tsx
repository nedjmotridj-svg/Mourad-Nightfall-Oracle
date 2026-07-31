import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ROLES } from "@/data/roles";
import { RoleCard } from "@/components/RoleCard";
import { clearGame, loadGameMaster, loadNames, saveSetup } from "@/lib/session";
import { TopBar } from "@/components/TopBar";
import { useI18n } from "@/lib/i18n";

const TITLE = "Composition du village — Nightfall Oracle";
const DESC = "Choisis les rôles en jeu, puis laisse l'oracle distribuer les cartes.";

const MULTI = ["loup-garou", "simple-villageois"];

export const Route = createFileRoute("/composition")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: CompositionPage,
});

function CompositionPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [gm, setGm] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    "loup-garou": 2,
    "simple-villageois": 3,
    voyante: 1,
    sorciere: 1,
    chasseur: 1,
  });

  useEffect(() => {
    // Le Maître du Jeu ne reçoit pas de carte : il est exclu du pool actif.
    const master = loadGameMaster();
    setGm(master);
    setNames(loadNames().filter((n) => n !== master));
  }, []);

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts],
  );

  const bump = (id: string, delta: number) =>
    setCounts((c) => {
      const max = MULTI.includes(id) ? 12 : 1;
      const next = Math.min(max, Math.max(0, (c[id] ?? 0) + delta));
      return { ...c, [id]: next };
    });

  const start = () => {
    const pool: string[] = [];
    Object.entries(counts).forEach(([id, n]) => {
      for (let i = 0; i < n; i++) pool.push(id);
    });
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    clearGame();
    saveSetup({
      players: names.map((name, i) => ({ name, roleId: pool[i] })),
      gameMaster: gm ?? undefined,
    });
    navigate({ to: "/distribution" });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-4 pb-32">
      <TopBar
        left={
          <button
            onClick={() => navigate({ to: "/gamemaster" })}
            className="text-sm text-muted-foreground"
          >
            {t("back")}
          </button>
        }
      />
      <h1 className="neon-text mt-3 text-2xl font-black">{t("compositionTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("compositionCount", { r: total, p: names.length })}
      </p>
      {gm && (
        <p className="mt-1 mb-6 text-xs font-bold text-primary">
          {t("gmExcluded", { n: names.length })}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {ROLES.map((role, i) => (
          <RoleCard
            key={role.id}
            role={role}
            index={i}
            selected={(counts[role.id] ?? 0) > 0}
            footer={
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    bump(role.id, -1);
                  }}
                  className="size-7 rounded-full border border-border text-sm"
                >
                  −
                </button>
                <span className="text-sm font-bold">{counts[role.id] ?? 0}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    bump(role.id, 1);
                  }}
                  className="size-7 rounded-full bg-primary text-sm text-primary-foreground"
                >
                  +
                </button>
              </div>
            }
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-4">
        <button
          disabled={total !== names.length || names.length === 0}
          onClick={start}
          className="neon-ring mx-auto block w-full max-w-lg rounded-full bg-primary py-4 font-bold text-primary-foreground disabled:opacity-40"
        >
          {total === names.length
            ? t("distribute")
            : t("rolesProgress", { r: total, p: names.length })}
        </button>
      </div>
    </main>
  );
}