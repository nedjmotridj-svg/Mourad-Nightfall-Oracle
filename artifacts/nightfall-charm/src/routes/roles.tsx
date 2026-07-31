import { createFileRoute, Link } from "@tanstack/react-router";
import { ROLES } from "@/data/roles";
import { RoleCard } from "@/components/RoleCard";
import { NarratorCard } from "@/components/NarratorCard";
import { TopBar } from "@/components/TopBar";
import { useI18n } from "@/lib/i18n";

const TITLE = "Les 24 rôles — Nightfall Oracle";
const DESC =
  "Découvre les 24 rôles du village : portraits mystiques, description et pouvoir de chaque carte.";

export const Route = createFileRoute("/roles")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-3xl px-4 py-4 pb-10">
      <TopBar
        left={
          <Link to="/" className="text-sm text-muted-foreground">
            {t("back")}
          </Link>
        }
      />
      <h1 className="neon-text mt-4 text-2xl font-black">{t("grimoireTitle")}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{t("grimoireHint")}</p>

      <div className="mb-8">
        <NarratorCard title={t("narratorTitle")} text={t("narratorIntro")} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {ROLES.map((role, i) => (
          <RoleCard key={role.id} role={role} index={i} />
        ))}
      </div>
    </main>
  );
}
