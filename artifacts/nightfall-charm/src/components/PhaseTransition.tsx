import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { playNightFall, playMorningBell } from "@/lib/audio";

/** Carte plein écran "La nuit tombe" / "Le jour se lève". */
export function PhaseTransition({
  kind,
  subtitle,
  onDone,
}: {
  kind: "NIGHT" | "DAY";
  subtitle?: string;
  onDone: () => void;
}) {
  const { t: tr } = useI18n();

  // SFX au moment où la carte apparaît
  useEffect(() => {
    if (kind === "NIGHT") playNightFall();
    else playMorningBell();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  const night = kind === "NIGHT";

  return (
    <div
      role="status"
      onClick={onDone}
      className="animate-fade-veil fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-background px-8 text-center"
    >
      <div
        className={`grid size-32 place-items-center rounded-full text-6xl ${
          night
            ? "animate-moon-rise bg-primary/10 text-primary"
            : "animate-sun-rise bg-accent/15 text-accent"
        }`}
      >
        {night ? "🌙" : "🌅"}
      </div>
      <h2 className="neon-text text-3xl font-black tracking-tight">
        {night ? tr("nightFalls") : tr("dayRises")}
      </h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
        {tr("tapToContinue")}
      </p>
    </div>
  );
}
