import { Volume2 } from "lucide-react";
import { speakRole } from "@/lib/audio";

/** Bouton haut-parleur : le narrateur annonce le nom du rôle. */
export function SpeakButton({ text, className = "" }: { text: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`Annoncer à voix haute : ${text}`}
      onClick={() => speakRole(text)}
      className={`neon-ring grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary transition active:scale-95 ${className}`}
    >
      <Volume2 className="size-5" />
    </button>
  );
}
