import { useEffect, useState } from "react";

const TEXT = "Mourad's Ville";

export function AnimatedTitle() {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = window.setInterval(() => {
      i += 1;
      setTyped(TEXT.slice(0, i));
      if (i >= TEXT.length) {
        window.clearInterval(interval);
        window.setTimeout(() => setDone(true), 300);
      }
    }, 95); // slightly slow — unsettling pace
    return () => window.clearInterval(interval);
  }, []);

  return (
    <h1 className="relative mx-auto max-w-[14ch] text-center text-5xl leading-[1.1] font-black sm:text-7xl">
      <span className="sr-only">{TEXT}</span>
      <span
        aria-hidden
        className={`ring-title block${done ? " animate-title-ring-pulse" : ""}`}
      >
        {typed}
        {!done && (
          <span className="animate-caret ml-0.5 inline-block ring-title">
            |
          </span>
        )}
      </span>
    </h1>
  );
}
