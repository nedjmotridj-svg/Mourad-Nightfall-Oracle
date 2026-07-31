import meneur from "@/assets/meneur.jpg";

export function NarratorCard({
  title = "Le Meneur du Jeu",
  text,
  children,
}: {
  title?: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="surface-card animate-rise-in neon-ring overflow-hidden rounded-3xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={meneur}
          alt="Le meneur du jeu, conteur masqué au grimoire lumineux"
          width={640}
          height={640}
          loading="lazy"
          className="animate-slow-zoom h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <p className="absolute bottom-3 left-4 text-xs font-bold tracking-[0.3em] text-primary uppercase">
          {title}
        </p>
      </div>
      <div className="space-y-4 p-5">
        <p className="text-base leading-relaxed">{text}</p>
        {children}
      </div>
    </div>
  );
}