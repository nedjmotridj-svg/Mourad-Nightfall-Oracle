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
      {night ? (
        /* ── Glowing crescent moon ─────────────────────────────── */
        <div className="animate-moon-rise animate-moon-glow relative grid size-36 place-items-center rounded-full">
          <svg viewBox="0 0 120 120" className="size-32" fill="none" aria-hidden>
            <defs>
              <radialGradient id="mg-night" cx="42%" cy="48%" r="50%">
                <stop offset="0%"  stopColor="oklch(0.88 0.10 345)" />
                <stop offset="55%" stopColor="oklch(0.589 0.239 359.7)" />
                <stop offset="100%" stopColor="oklch(0.589 0.239 359.7)" stopOpacity="0" />
              </radialGradient>
              <mask id="mm-night">
                <rect width="120" height="120" fill="white" />
                <circle cx="76" cy="44" r="32" fill="black" />
              </mask>
            </defs>
            {/* Outer soft halo */}
            <circle cx="54" cy="60" r="50" fill="oklch(0.589 0.239 359.7 / 8%)" />
            {/* Main crescent */}
            <circle cx="54" cy="60" r="36" fill="url(#mg-night)" mask="url(#mm-night)" />
            {/* Inner highlight rim */}
            <circle cx="54" cy="60" r="36" fill="none"
              stroke="oklch(0.85 0.12 350 / 25%)" strokeWidth="1" mask="url(#mm-night)" />
          </svg>
          {/* Glow ring behind the moon */}
          <div className="animate-moon-glow absolute inset-0 rounded-full" />
        </div>
      ) : (
        /* ── Glowing sun ────────────────────────────────────────── */
        <div className="animate-sun-rise relative grid size-36 place-items-center">
          {/* Rotating rays */}
          <svg viewBox="0 0 120 120" className="animate-ray-spin absolute size-36" fill="none" aria-hidden>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const r = (angle * Math.PI) / 180;
              return (
                <line
                  key={angle}
                  x1={60 + 36 * Math.cos(r)}
                  y1={60 + 36 * Math.sin(r)}
                  x2={60 + 54 * Math.cos(r)}
                  y2={60 + 54 * Math.sin(r)}
                  stroke="oklch(0.634 0.254 17.6)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeOpacity="0.7"
                />
              );
            })}
          </svg>
          {/* Sun disc */}
          <svg viewBox="0 0 120 120" className="size-28" fill="none" aria-hidden>
            <defs>
              <radialGradient id="mg-day" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stopColor="oklch(0.92 0.15 80)" />
                <stop offset="50%" stopColor="oklch(0.82 0.20 50)" />
                <stop offset="100%" stopColor="oklch(0.634 0.254 17.6)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="54" fill="oklch(0.634 0.254 17.6 / 8%)" />
            <circle cx="60" cy="60" r="30" fill="url(#mg-day)" />
          </svg>
          {/* Glow ring */}
          <div className="animate-sun-glow absolute inset-4 rounded-full" />
        </div>
      )}

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
