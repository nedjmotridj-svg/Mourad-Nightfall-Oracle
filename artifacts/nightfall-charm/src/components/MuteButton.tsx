import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { initAudioPrefs, isMuted, subscribeMute, toggleMuted, unlockAudio } from "@/lib/audio";
import { useI18n } from "@/lib/i18n";

/** Bouton global de coupure du son (BGM + SFX + narration). */
export function MuteButton() {
  const { t } = useI18n();
  const [m, setM] = useState(false);

  useEffect(() => {
    initAudioPrefs();
    setM(isMuted());
    return subscribeMute(setM);
  }, []);

  return (
    <button
      type="button"
      aria-label={m ? t("soundOff") : t("soundOn")}
      aria-pressed={m}
      onClick={() => {
        unlockAudio();
        toggleMuted();
      }}
      className={`glass-neon-btn grid size-10 place-items-center rounded-full transition active:scale-95 ${
        m ? "text-muted-foreground" : "text-primary"
      }`}
    >
      {m ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </button>
  );
}
