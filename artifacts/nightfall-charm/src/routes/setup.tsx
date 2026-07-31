import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_SETTINGS,
  loadNames,
  loadSettings,
  saveNames,
  saveSettings,
  type GameSettings,
} from "@/lib/session";

const TITLE = "Noms des joueurs — Nightfall Oracle";
const DESC = "Ajoute les joueurs autour de la table avant de distribuer les rôles.";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [names, setNames] = useState<string[]>(Array(8).fill(""));
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = loadNames();
    if (saved.length) setNames(saved);
    setSettings(loadSettings());
  }, []);

  const update = (i: number, v: string) =>
    setNames((n) => n.map((x, k) => (k === i ? v : x)));

  const filled = names.map((n, i) => n.trim() || `${t("defaultPlayer")} ${i + 1}`);

  return (
    <main className="mx-auto max-w-lg px-4 py-4 pb-28">
      <TopBar
        left={
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-sm text-muted-foreground"
          >
            {t("back")}
          </button>
        }
      />
      <h1 className="neon-text mt-3 mb-6 text-2xl font-black">{t("setupTitle")}</h1>

      <div className="space-y-3">
        {names.map((n, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <input
              value={n}
              onChange={(e) => update(i, e.target.value)}
              placeholder={t("playerNamePlaceholder")}
              className="w-full rounded-full bg-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              aria-label={t("remove")}
              onClick={() => setNames((s) => s.filter((_, k) => k !== i))}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setNames((s) => [...s, ""])}
        className="mt-4 w-full rounded-full border border-dashed border-border py-3 text-sm text-muted-foreground"
      >
        {t("addPlayer")}
      </button>

      <section className="surface-card mt-6 space-y-4 rounded-3xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">{t("debateTimer")}</h2>
            <p className="text-xs text-muted-foreground">{t("debateTimerDesc")}</p>
          </div>
          <button
            role="switch"
            aria-checked={settings.isDebateTimerEnabled}
            aria-label={t("debateTimerToggle")}
            onClick={() =>
              setSettings((s) => ({
                ...s,
                isDebateTimerEnabled: !s.isDebateTimerEnabled,
              }))
            }
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              settings.isDebateTimerEnabled ? "neon-ring bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-foreground transition-all ${
                settings.isDebateTimerEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {settings.isDebateTimerEnabled && (
          <div className="animate-rise-in space-y-3">
            <div className="flex flex-wrap gap-2">
              {[30, 60, 90, 120].map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setSettings((s) => ({ ...s, debateTimePerPlayer: v }))
                  }
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    settings.debateTimePerPlayer === v
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {v}s
                </button>
              ))}
              <span className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
                {t("custom")}
              </span>
              <input
                type="number"
                min={10}
                max={600}
                aria-label={t("custom")}
                value={settings.debateTimePerPlayer}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    debateTimePerPlayer: Math.max(
                      5,
                      Math.min(600, Number(e.target.value) || 0),
                    ),
                  }))
                }
                className="w-20 rounded-full bg-input px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("perPlayerDebate", { n: settings.debateTimePerPlayer })}
            </p>
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-4">
        <button
          disabled={names.length < 4}
          onClick={() => {
            saveNames(filled);
            saveSettings(settings);
            navigate({ to: "/gamemaster" });
          }}
          className="neon-ring mx-auto block w-full max-w-lg rounded-full bg-primary py-4 font-bold text-primary-foreground disabled:opacity-40"
        >
          {t("next")}
        </button>
      </div>
    </main>
  );
}
