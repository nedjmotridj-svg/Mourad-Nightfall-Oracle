import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MuteButton } from "@/components/MuteButton";

/** Barre de navigation supérieure : toujours visible sur chaque écran.
 *  Contient le sélecteur de langue (FR / EN / AR) et le bouton de son. */
export function TopBar({ left }: { left?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 -mx-4 mb-2 flex items-center justify-between gap-3 bg-background/80 px-4 py-3 backdrop-blur">
      <div className="min-w-0 flex-1">{left}</div>
      <div className="flex shrink-0 items-center gap-2">
        <LanguageSwitcher />
        <MuteButton />
      </div>
    </header>
  );
}
