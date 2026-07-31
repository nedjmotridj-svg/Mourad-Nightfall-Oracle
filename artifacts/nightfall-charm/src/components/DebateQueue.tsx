import { useEffect, useState } from "react";
import { Crown, Pause, Play, SkipForward } from "lucide-react";
import { playTimeUpAlert } from "@/lib/audio";
import { useI18n } from "@/lib/i18n";
import type { Player } from "@/game/engine";

/** File de parole séquentielle, capitaine en premier. */
export function DebateQueue({
  players,
  seconds,
  captainId,
  onFinish,
}: {
  players: Player[];
  seconds: number;
  captainId?: string;
  onFinish: () => void;
}) {
  const { t } = useI18n();
  const captain = players.find((p) => p.id === captainId);
  const queue: { player: Player; label?: string }[] = captain
    ? [
        { player: captain, label: t("opening") },
        ...players
          .filter((p) => p.id !== captainId)
          .map((player) => ({ player })),
        { player: captain, label: t("closing") },
      ]
    : players.map((player) => ({ player }));
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(true);

  useEffect(() => setLeft(seconds), [i, seconds]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [running, i]);

  useEffect(() => {
    if (left === 0) playTimeUpAlert();
  }, [left]);

  const entry = queue[i];
  if (!entry) return null;
  const current = entry.player;
  const pct = Math.max(0, (left / seconds) * 100);

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        {t("speaker", { i: i + 1, n: queue.length })}
      </p>
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-black">{current.name}</h3>
        {entry.label && (
          <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary uppercase">
            {entry.label}
          </span>
        )}
        {current.id === captainId && (
          <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-1 text-[10px] font-bold text-accent uppercase">
            <Crown className="size-3" /> {t("captain")}
          </span>
        )}
      </div>

      <div
        className={`text-4xl font-black tabular-nums ${left === 0 ? "animate-danger-pulse rounded-xl text-destructive" : "text-primary"}`}
      >
        {String(Math.floor(left / 60)).padStart(2, "0")}:
        {String(left % 60).padStart(2, "0")}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-input">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-semibold"
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? t("pause") : t("resume")}
        </button>
        <button
          onClick={() => (i + 1 < queue.length ? setI(i + 1) : onFinish())}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-2 py-3 text-xs font-bold text-primary-foreground"
        >
          <SkipForward className="size-4" />
          {i + 1 < queue.length ? t("next") : t("endDebate")}
        </button>
      </div>
    </div>
  );
}
