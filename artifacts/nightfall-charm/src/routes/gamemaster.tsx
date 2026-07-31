import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { loadGameMaster, loadNames, saveGameMaster } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";

const TITLE = "Maître du Jeu — Nightfall Oracle";
const DESC =
  "Désigne le Maître du Jeu qui guidera la partie avant de choisir les rôles.";

export const Route = createFileRoute("/gamemaster")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: GameMasterPage,
});

function GameMasterPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [names, setNames] = useState<string[]>([]);
  const [mj, setMj] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadNames();
    if (!saved.length) {
      navigate({ to: "/setup" });
      return;
    }
    setNames(saved);
    setMj(loadGameMaster());
  }, [navigate]);

  const random = () =>
    setMj(names.length ? names[Math.floor(Math.random() * names.length)] : null);

  return (
    <main className="mx-auto max-w-lg px-4 py-4 pb-28">
      <TopBar
        left={
          <button
            onClick={() => navigate({ to: "/setup" })}
            className="text-sm text-muted-foreground"
          >
            {t("back")}
          </button>
        }
      />
      <h1 className="gradient-text mt-3 text-3xl font-black">{t("gmTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("gmSubtitle")}</p>
      {mj && (
        <p className="mt-2 mb-4 text-xs font-bold text-primary">
          {t("gmExcluded", { n: Math.max(0, names.length - 1) })}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {names.map((n) => (
          <button
            key={n}
            onClick={() => setMj(n)}
            className={`relative rounded-2xl border px-3 py-4 text-sm font-semibold transition ${
              mj === n
                ? "neon-ring border-primary bg-primary/15 text-primary"
                : "border-border bg-card/60"
            }`}
          >
            {mj === n && (
              <span className="gradient-neon absolute -top-2 -end-2 grid size-6 place-items-center rounded-full text-primary-foreground">
                <Crown className="size-3.5" />
              </span>
            )}
            {n}
          </button>
        ))}
      </div>

      <button
        onClick={random}
        className="mt-5 w-full rounded-full border border-primary py-3 text-sm font-bold text-primary"
      >
        {t("gmRandom")}
      </button>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-4">
        <button
          disabled={!mj}
          onClick={() => {
            if (!mj) return;
            saveGameMaster(mj);
            navigate({ to: "/composition" });
          }}
          className="gradient-neon neon-ring mx-auto block w-full max-w-lg rounded-full py-4 font-black text-primary-foreground disabled:opacity-40"
        >
          {mj ? `${t("gmChosen")} : ${mj} — ${t("gmNext")}` : t("gmNext")}
        </button>
      </div>
    </main>
  );
}
