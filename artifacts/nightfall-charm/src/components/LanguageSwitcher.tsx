import { LANGS, useI18n } from "@/lib/i18n";

/** Sélecteur de langue en verre dépoli, ancré en haut à droite. */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      aria-label={t("language")}
      className="glass-neon-btn flex items-center gap-1 rounded-full p-1"
    >
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          aria-label={l.name}
          className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 active:scale-95 ${
            lang === l.code
              ? "gradient-neon neon-ring text-primary-foreground"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
