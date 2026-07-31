import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo-wolf-moon.jpg";
import { AnimatedTitle } from "@/components/AnimatedTitle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MuteButton } from "@/components/MuteButton";
import { useI18n } from "@/lib/i18n";
import { clearBgm, startBgm, unlockAudio } from "@/lib/audio";
import { useEffect } from "react";

const TITLE = "Mourad's Ville";
const DESC =
  "Meneur de jeu numérique pour Loup-Garou : 24 rôles illustrés, moteur de nuit complet et vote du village.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();

  useEffect(() => {
    clearBgm();
  }, []);

  return (
    <main
      onPointerDown={unlockAudio}
      className="flex min-h-screen flex-col items-center gap-7 px-5 pt-20 pb-12"
    >
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-end gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <MuteButton />
        </div>
      </header>

      <div className="animate-logo-ring-pulse gradient-ring-pink mt-4 rounded-full p-[8px]">
        <div className="size-52 overflow-hidden rounded-full sm:size-64">
          <img
            src={logo}
            alt={t("logoAlt")}
            width={640}
            height={640}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      </div>

      <AnimatedTitle />
      <p className="-mt-2 text-sm text-muted-foreground">{t("tagline")}</p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          to="/setup"
          onClick={() => { unlockAudio(); startBgm("LOBBY"); }}
          className="gradient-neon rounded-full px-6 py-4 text-center font-black text-primary-foreground transition hover:shadow-[0_0_30px_oklch(0.589_0.239_359.7/0.6)]"
        >
          {t("newGame")}
        </Link>
        <Link
          to="/roles"
          className="glass-neon-btn rounded-full px-6 py-4 text-center font-semibold text-foreground"
        >
          {t("grimoire")}
        </Link>
      </div>

      <p className="mt-4 text-[11px] tracking-[0.35em] text-muted-foreground uppercase">
        {t("footer")}
      </p>
    </main>
  );
}
