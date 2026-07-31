import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fr, type Dictionary, type UiKey } from "./locales/fr";
import { en } from "./locales/en";
import { ar } from "./locales/ar";
import { ROLE_BY_ID } from "@/data/roles";

export type Lang = "fr" | "en" | "ar";

export const LANGS: { code: Lang; label: string; name: string }[] = [
  { code: "fr", label: "FR", name: "Français" },
  { code: "en", label: "EN", name: "English" },
  { code: "ar", label: "AR", name: "العربية" },
];

const DICTS: Record<Lang, Dictionary> = { fr, en, ar };

export type TranslationKey = UiKey;

const KEY = "mvno-lang";

export interface RoleText {
  name: string;
  description: string;
  power: string;
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Traduction d'une clé d'interface, avec variables {x}. */
  t: (k: UiKey, vars?: Record<string, string | number>) => string;
  /** Nom / description / pouvoir traduits d'un rôle. */
  role: (id: string) => RoleText;
  /** Nom traduit d'un rôle (raccourci). */
  roleName: (id: string) => string;
  /** Consigne nocturne traduite d'un rôle. */
  prompt: (id: string) => string;
  /** Libellé de camp traduit. */
  team: (t: string) => string;
  dir: "ltr" | "rtl";
}

function interpolate(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) =>
    k in vars ? String(vars[k]) : m,
  );
}

const fallback: Ctx = {
  lang: "fr",
  setLang: () => {},
  t: (k, vars) => interpolate(fr.ui[k], vars),
  role: (id) => roleTextFor("fr", id),
  roleName: (id) => roleTextFor("fr", id).name,
  prompt: (id) => fr.prompts[id] ?? "",
  team: (t) => fr.teams[t] ?? t,
  dir: "ltr",
};

function roleTextFor(lang: Lang, id: string): RoleText {
  const base = ROLE_BY_ID[id];
  const over = DICTS[lang].roles[id];
  return {
    name: over?.name ?? base?.name ?? id,
    description: over?.description ?? base?.description ?? "",
    power: over?.power ?? base?.power ?? "",
  };
}

const I18nContext = createContext<Ctx>(fallback);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Lang | null;
    if (saved && DICTS[saved]) setLangState(saved);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = DICTS[lang];
    return {
      lang,
      setLang,
      t: (k, vars) => interpolate(dict.ui[k] ?? fr.ui[k] ?? String(k), vars),
      role: (id) => roleTextFor(lang, id),
      roleName: (id) => roleTextFor(lang, id).name,
      prompt: (id) => dict.prompts[id] ?? fr.prompts[id] ?? "",
      team: (t) => dict.teams[t] ?? fr.teams[t] ?? t,
      dir: lang === "ar" ? "rtl" : "ltr",
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
