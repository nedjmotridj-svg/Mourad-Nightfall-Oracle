import { ROLE_BY_ID, type Team } from "@/data/roles";

export type Phase =
  | "NUIT_1"
  | "NUIT"
  | "AUBE"
  | "JOUR_VOTE"
  | "EVENEMENT_MORT"
  | "FIN";

export type DeathCause =
  | "WOLVES"
  | "WITCH_POISON"
  | "WHITE_WOLF_KILL"
  | "HUNTER_SHOT"
  | "HEARTBREAK"
  | "VILLAGE_VOTE"
  | "JAILER_EXECUTION"
  | "SPY_DETECTED"
  | "TALKATIVE_WOLF"
  | "GENERAL_STRIKE"
  | "GENERAL_FAILED";

export const DEATH_LABEL: Record<DeathCause, string> = {
  WOLVES: "dévoré par les loups",
  WITCH_POISON: "empoisonné par la Sorcière",
  WHITE_WOLF_KILL: "égorgé par le Loup Blanc",
  HUNTER_SHOT: "abattu par le Chasseur",
  HEARTBREAK: "mort de chagrin",
  VILLAGE_VOTE: "exécuté par le village",
  JAILER_EXECUTION: "exécuté par le Geôlier",
  SPY_DETECTED: "repérée par la meute",
  TALKATIVE_WOLF: "trahi par son silence",
  GENERAL_STRIKE: "abattu par le Général",
  GENERAL_FAILED: "éliminé par le Maître du Jeu (coup manqué du Général)",
};

export interface Player {
  id: string;
  name: string;
  roleId: string;
  team: Team;
  alive: boolean;
  lives: number;
  isLover: boolean;
  enchanted: boolean;
  abilityUsed: boolean;
  canVote: boolean;
  immuneToDayVote: boolean;
  voteWeight: number;
  baseVotes: number;
  powersDisabled: boolean;
  disabledNightAbility: boolean;
  isCaptain?: boolean;
  isConvertedToWolf?: boolean;
  originalRoleId?: string;
  retainsOriginalPowers?: boolean;
  hasUsedLifePotion?: boolean;
  hasUsedDeathPotion?: boolean;
  healUsed?: boolean;
  poisonUsed?: boolean;
  roleModelId?: string;
  copiedRoleId?: string;
  deathCause?: DeathCause;
  /** Interdit de débattre le matin suivant (pouvoir du Loup Noir). */
  mutedForDay?: boolean;
}

export interface Step {
  key: string;
  roleId: string;
  title: string;
  prompt: string;
  mode:
    | "one"
    | "two"
    | "yesno"
    | "info"
    | "witch"
    | "word"
    | "bear"
    | "wolves"
    | "blackwolf";
  optional?: boolean;
  actorId?: string;
}

export interface RoundState {
  attackedId?: string;
  protectedId?: string;
  previousProtectedId?: string;
  jailedId?: string;
  poisonedId?: string;
  healed?: boolean;
  whiteWolfKillId?: string;
  blackWolfConvert?: boolean;
  spyCaught?: boolean;
  ravenTargetId?: string;
  drinkTargetId?: string;
  requiredWord?: string;
  bearGrowls?: boolean;
  /** Joueur réduit au silence par le Loup Noir pour le débat du matin. */
  mutedId?: string;
  /** Cible muselée la nuit précédente (interdite deux nuits de suite). */
  previousMutedId?: string;
  /** La meute n'a pas trouvé d'accord : la Matriarche tranche. */
  wolvesDisagreed?: boolean;
}

export interface GameState {
  phase: Phase;
  night: number;
  day: number;
  players: Player[];
  steps: Step[];
  stepIndex: number;
  round: RoundState;
  log: string[];
  reveal?: string;
  pendingDeaths: { id: string; cause: DeathCause }[];
  hunterPending?: string;
  dawnSummary: string[];
  voteSkippedOffer: boolean;
  villageCaptainId?: string;
  revoteDone?: boolean;
  captainSuccessionPending?: string;
  lastEliminated?: { id: string; roleId: string; name: string }[];
  winnerTeam?: "VILLAGE" | "WOLVES" | "OTHER";
  winner?: string;
}

const WORDS = [
  "lune",
  "sang",
  "silence",
  "forêt",
  "brume",
  "clocher",
  "corbeau",
  "lanterne",
];

const uid = () => Math.random().toString(36).slice(2, 10);

export function effectiveRoleId(p: Player) {
  return p.copiedRoleId ?? p.roleId;
}

export function createGame(
  input: { name: string; roleId: string }[],
  villageCaptainId?: string,
): GameState {
  const players: Player[] = input.map((p) => ({
    id: uid(),
    name: p.name,
    roleId: p.roleId,
    team: ROLE_BY_ID[p.roleId]?.team ?? "VILLAGEOIS",
    alive: true,
    lives: p.roleId === "ancien" ? 2 : 1,
    isLover: false,
    enchanted: false,
    abilityUsed: false,
    canVote: true,
    immuneToDayVote: false,
    voteWeight: 1,
    baseVotes: 0,
    powersDisabled: false,
    disabledNightAbility: false,
    isConvertedToWolf: false,
    retainsOriginalPowers: true,
    hasUsedLifePotion: false,
    hasUsedDeathPotion: false,
  }));

  // Le capitaine est désigné par index (élection faite avant la partie).
  const captain = players.find((p) => p.name === villageCaptainId);
  if (captain) {
    captain.isCaptain = true;
    // Poids de vote : Général = 1, Capitaine = 2.
    captain.voteWeight = 2;
  }

  const state: GameState = {
    phase: "NUIT_1",
    night: 1,
    day: 0,
    players,
    steps: [],
    stepIndex: 0,
    round: {},
    log: ["La nuit tombe sur le village pour la première fois…"],
    pendingDeaths: [],
    dawnSummary: [],
    voteSkippedOffer: false,
    villageCaptainId: captain?.id,
    lastEliminated: [],
  };
  state.steps = buildNightSteps(state);
  return state;
}

export function alivePlayers(s: GameState) {
  return s.players.filter((p) => p.alive);
}

function hasRole(s: GameState, roleId: string) {
  return s.players.find(
    (p) => p.alive && effectiveRoleId(p) === roleId && !p.disabledNightAbility,
  );
}

export function buildNightSteps(s: GameState): Step[] {
  const first = s.night === 1;
  const steps: Step[] = [];
  const push = (
    roleId: string,
    title: string,
    prompt: string,
    mode: Step["mode"],
    optional = false,
  ) => {
    const actor = hasRole(s, roleId);
    if (!actor) return;
    if (actor.powersDisabled) return;
    steps.push({
      key: `${s.night}-${roleId}`,
      roleId,
      title,
      prompt,
      mode,
      optional,
      actorId: actor.id,
    });
  };

  if (first) {
    push("cupidon", "Cupidon", "Désigne les deux amoureux.", "two");
    push("mime", "Mime", "Choisis le joueur dont tu copies le rôle.", "one");
    push(
      "enfant-sauvage",
      "Enfant Sauvage",
      "Choisis ton modèle.",
      "one",
    );
  }

  push("geolier", "Geôlier", "Qui séquestres-tu cette nuit ?", "one");
  // Voyante : n'agit qu'à partir de la nuit 2.
  if (!first) push("voyante", "Voyante", "Quel joueur veux-tu sonder ?", "one");
  push(
    "salvateur",
    "Salvateur",
    "Qui protèges-tu cette nuit ? (jamais deux fois de suite)",
    "one",
  );
  push(
    "petite-fille",
    "Petite Fille",
    "Tu entrouvres les yeux… veux-tu espionner la meute ?",
    "yesno",
    true,
  );
  push(
    "loup-garou",
    "Les Loups-Garous",
    "La meute désigne sa victime. En cas de désaccord, la Matriarche tranchera seule.",
    "wolves",
  );
  push(
    "loup-noir",
    "Loup Noir",
    "Contamine la victime (une fois par partie) et/ou impose le silence à un joueur.",
    "blackwolf",
    true,
  );
  if (s.night % 2 === 0) {
    push(
      "loup-blanc",
      "Loup Blanc",
      "Veux-tu dévorer un loup cette nuit ?",
      "one",
      true,
    );
  }
  // Loup Bavard : inactif la nuit 1, se réveille en dernier parmi les loups.
  if (!first) {
    const talkative = hasRole(s, "loup-bavard");
    if (talkative && !talkative.powersDisabled) {
      s.round.requiredWord =
        s.round.requiredWord ?? WORDS[Math.floor(Math.random() * WORDS.length)];
      steps.push({
        key: `${s.night}-loup-bavard`,
        roleId: "loup-bavard",
        title: "Loup Bavard",
        prompt:
          "Le Maître du Jeu montre le mot secret : il devra être prononcé pendant le débat du matin.",
        mode: "word",
        actorId: talkative.id,
      });
    }
  }
  // Secret : la Sorcière est appelée chaque nuit tant qu'elle est vivante,
  // même si ses deux potions sont épuisées.
  push("sorciere", "Sorcière", "Utilise tes potions.", "witch", true);
  push(
    "joueur-de-flute",
    "Joueur de Flûte",
    "Enchante deux joueurs.",
    "two",
    true,
  );
  push("corbeau", "Corbeau", "Sur qui déposes-tu la plume noire ?", "one", true);
  push("tavernier", "Tavernier", "À qui offres-tu un verre ?", "one", true);

  // Général : une seule fois, uniquement nuit 2 ou nuit 3.
  if (s.night === 2 || s.night === 3) {
    const gen = hasRole(s, "general");
    if (gen && !gen.abilityUsed && !gen.powersDisabled) {
      steps.push({
        key: `${s.night}-general`,
        roleId: "general",
        title: "Général",
        prompt:
          "Désigne le joueur que tu veux abattre. Si ce n'est pas un loup, tu meurs.",
        mode: "one",
        optional: true,
        actorId: gen.id,
      });
    }
  }

  // Montreur d'Ours : nuit 1 uniquement, toujours en tout dernier.
  if (first) {
    push(
      "montreur-dours",
      "Montreur d'Ours",
      "L'ours flaire ses voisins…",
      "bear",
    );
  }

  return steps;
}

export function currentStep(s: GameState): Step | undefined {
  return s.steps[s.stepIndex];
}

/** Voisins vivants immédiats (gauche / droite) du Montreur d'Ours. */
export function bearNeighbors(s: GameState, bearId: string) {
  const living = s.players.filter((p) => p.alive);
  const i = living.findIndex((p) => p.id === bearId);
  if (i < 0) return { left: undefined, right: undefined };
  return {
    left: living[(i - 1 + living.length) % living.length],
    right: living[(i + 1) % living.length],
  };
}

/** L'ours gronde si un voisin vivant est un loup, ou si l'ours est infecté. */
export function bearShouldGrowl(s: GameState, bearId: string): boolean {
  const bear = s.players.find((p) => p.id === bearId);
  const { left, right } = bearNeighbors(s, bearId);
  return [left, right, bear].some(
    (n) => !!n && (n.team === "WEREWOLVES" || n.isConvertedToWolf === true),
  );
}

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

export interface StepPayload {
  targetId?: string;
  targetIds?: string[];
  yes?: boolean;
  healUsed?: boolean;
  poisonId?: string;
  /** Loup Noir : joueur réduit au silence pour le débat du matin. */
  muteId?: string;
  /** Les Loups-Garous : la meute n'est pas parvenue à un accord. */
  disagreement?: boolean;
}

export function submitStep(state: GameState, payload: StepPayload): GameState {
  const s = clone(state);
  const step = s.steps[s.stepIndex];
  if (!step) return resolveNight(s);
  const actor = s.players.find((p) => p.id === step.actorId)!;
  const target = payload.targetId
    ? s.players.find((p) => p.id === payload.targetId)
    : undefined;
  s.reveal = undefined;

  switch (step.roleId) {
    case "cupidon": {
      const [a, b] = (payload.targetIds ?? []).map((id) =>
        s.players.find((p) => p.id === id),
      );
      if (a && b) {
        a.isLover = true;
        b.isLover = true;
        if (a.team !== b.team) {
          a.team = "LOVERS";
          b.team = "LOVERS";
        }
        s.reveal = `${a.name} et ${b.name} sont désormais amoureux.`;
        s.log.push(`Cupidon lie ${a.name} et ${b.name}.`);
      }
      break;
    }
    case "mime": {
      if (target) {
        actor.copiedRoleId = target.roleId;
        s.reveal = `Tu copies le rôle : ${ROLE_BY_ID[target.roleId].name}.`;
      }
      break;
    }
    case "enfant-sauvage": {
      if (target) {
        actor.roleModelId = target.id;
        s.reveal = `Ton modèle est ${target.name}.`;
      }
      break;
    }
    case "geolier": {
      if (target) {
        s.round.jailedId = target.id;
        target.disabledNightAbility = true;
        if (payload.yes) {
          s.pendingDeaths.push({ id: target.id, cause: "JAILER_EXECUTION" });
          s.reveal = `${target.name} est exécuté dans sa geôle.`;
        } else {
          s.reveal = `${target.name} passe la nuit sous les verrous, à l'abri des crocs.`;
        }
        s.steps = rebuildRemaining(s);
      }
      break;
    }
    case "voyante": {
      if (target) {
        // La Voyante ne voit que le rôle d'origine (jamais la conversion).
        const seenId = target.originalRoleId ?? effectiveRoleId(target);
        s.reveal = `${target.name} est : ${ROLE_BY_ID[seenId].name}.`;
      }
      break;
    }
    case "salvateur": {
      if (target) {
        s.round.protectedId = target.id;
        s.reveal = `${target.name} est protégé cette nuit.`;
      }
      break;
    }
    case "petite-fille": {
      if (payload.yes) {
        const caught = Math.random() < 0.25;
        if (caught) {
          s.round.spyCaught = true;
          s.pendingDeaths.push({ id: actor.id, cause: "SPY_DETECTED" });
          s.reveal = "Tu as été repérée par la meute… tu ne verras pas l'aube.";
        } else {
          const wolves = s.players.filter(
            (p) => p.alive && p.team === "WEREWOLVES",
          );
          const hint = wolves[Math.floor(Math.random() * wolves.length)];
          s.reveal = hint
            ? `Tu aperçois une silhouette : l'initiale « ${hint.name.charAt(0).toUpperCase()} ».`
            : "Tu n'aperçois rien dans l'obscurité.";
        }
      } else {
        s.reveal = "Tu gardes les yeux fermés.";
      }
      break;
    }
    case "loup-garou": {
      const matriarch = s.players.find(
        (p) =>
          p.alive &&
          effectiveRoleId(p) === "loup-matriarche" &&
          !p.disabledNightAbility &&
          !p.powersDisabled,
      );
      if (payload.disagreement && matriarch) {
        // La meute se rendort : la Matriarche tranche seule.
        s.round.wolvesDisagreed = true;
        s.round.attackedId = undefined;
        s.steps = [
          ...s.steps.slice(0, s.stepIndex + 1),
          {
            key: `${s.night}-loup-matriarche`,
            roleId: "loup-matriarche",
            title: "Loup Matriarche",
            prompt:
              "La meute n'a pas trouvé d'accord : désigne seule la victime de la nuit.",
            mode: "one",
            actorId: matriarch.id,
          },
          ...s.steps.slice(s.stepIndex + 1),
        ];
        s.reveal =
          "Désaccord dans la meute : les loups se rendorment, la Matriarche va trancher.";
      } else if (target) {
        s.round.attackedId = target.id;
        s.reveal = `La meute a choisi ${target.name}.`;
      }
      break;
    }
    case "loup-matriarche": {
      if (target) {
        s.round.attackedId = target.id;
        s.reveal = `La Matriarche impose ${target.name}.`;
        s.log.push(`La Matriarche tranche : ${target.name}.`);
      }
      break;
    }
    case "loup-bavard": {
      s.reveal = `Mot imposé au Loup Bavard : « ${s.round.requiredWord} ». Il devra le prononcer pendant le débat.`;
      break;
    }
    case "loup-noir": {
      const notes: string[] = [];
      if (payload.yes && s.round.attackedId && !actor.abilityUsed) {
        const victim = s.players.find((p) => p.id === s.round.attackedId)!;
        victim.originalRoleId = victim.roleId;
        victim.isConvertedToWolf = true;
        victim.retainsOriginalPowers = true;
        victim.team = "WEREWOLVES";
        s.round.attackedId = undefined;
        s.round.blackWolfConvert = true;
        actor.abilityUsed = true;
        notes.push(`${victim.name} rejoint la meute en gardant son pouvoir.`);
        s.log.push(`Le Loup Noir contamine ${victim.name}.`);
      }
      // Silence : à partir de la nuit 2, jamais la même cible deux nuits de suite.
      if (
        payload.muteId &&
        s.night >= 2 &&
        payload.muteId !== s.round.previousMutedId
      ) {
        const muted = s.players.find((p) => p.id === payload.muteId);
        if (muted) {
          s.round.mutedId = muted.id;
          notes.push(`${muted.name} ne pourra pas débattre demain matin.`);
          s.log.push(`Le Loup Noir impose le silence à ${muted.name}.`);
        }
      }
      s.reveal = notes.length ? notes.join(" ") : "La meute dévore comme prévu.";
      break;
    }
    case "loup-blanc": {
      if (target) {
        s.round.whiteWolfKillId = target.id;
        s.reveal = `${target.name} sera dévoré par le Loup Blanc.`;
      }
      break;
    }
    case "sorciere": {
      if (payload.healUsed && s.round.attackedId) {
        s.round.healed = true;
        s.round.attackedId = undefined;
        actor.healUsed = true;
        actor.hasUsedLifePotion = true;
        s.reveal = "La victime des loups est sauvée.";
      }
      if (payload.poisonId) {
        s.round.poisonedId = payload.poisonId;
        actor.poisonUsed = true;
        actor.hasUsedDeathPotion = true;
        const v = s.players.find((p) => p.id === payload.poisonId);
        s.reveal = `${v?.name} est empoisonné.`;
      }
      break;
    }
    case "joueur-de-flute": {
      (payload.targetIds ?? []).forEach((id) => {
        const p = s.players.find((x) => x.id === id);
        if (p) p.enchanted = true;
      });
      s.reveal = "La mélodie envoûte deux nouvelles âmes.";
      break;
    }
    case "corbeau": {
      if (target) {
        s.round.ravenTargetId = target.id;
        s.reveal = `${target.name} commencera le vote avec 2 voix.`;
      }
      break;
    }
    case "tavernier": {
      if (target) {
        s.round.drinkTargetId = target.id;
        s.reveal = `${target.name} a bu : demain il ne pourra pas voter, mais sera intouchable.`;
      }
      break;
    }
    case "montreur-dours": {
      s.round.bearGrowls = bearShouldGrowl(s, actor.id);
      s.reveal = s.round.bearGrowls
        ? "🐻 L'Ours grogne."
        : "Tout va bien.";
      break;
    }
    case "general": {
      if (target) {
        actor.abilityUsed = true;
        const isWolf =
          target.team === "WEREWOLVES" || target.isConvertedToWolf === true;
        if (isWolf) {
          s.pendingDeaths.push({ id: target.id, cause: "GENERAL_STRIKE" });
          s.players.forEach((p) => {
            p.isCaptain = false;
            p.voteWeight = 1;
          });
          actor.isCaptain = true;
          actor.voteWeight = 2;
          s.villageCaptainId = actor.id;
          s.reveal = `${target.name} était un Loup : il est abattu. ${actor.name} devient le nouveau Capitaine.`;
          s.log.push(`Le Général abat ${target.name} et devient Capitaine.`);
        } else {
          s.pendingDeaths.push({ id: actor.id, cause: "GENERAL_FAILED" });
          s.reveal = `${target.name} n'était pas un Loup : le Général est éliminé par le Maître du Jeu.`;
          s.log.push(`Le coup du Général échoue sur ${target.name}.`);
        }
      } else {
        s.reveal = "Le Général n'agit pas cette nuit.";
      }
      break;
    }
  }

  s.stepIndex += 1;
  if (s.stepIndex >= s.steps.length) {
    return resolveNight(s);
  }
  return s;
}

function rebuildRemaining(s: GameState): Step[] {
  const done = s.steps.slice(0, s.stepIndex + 1);
  const jailed = s.round.jailedId;
  return [
    ...done,
    ...s.steps
      .slice(s.stepIndex + 1)
      .filter((st) => st.actorId !== jailed || st.roleId === "loup-garou"),
  ];
}

function killPlayer(s: GameState, id: string, cause: DeathCause) {
  const p = s.players.find((x) => x.id === id);
  if (!p || !p.alive) return;

  if (cause === "WOLVES" && p.lives > 1) {
    p.lives -= 1;
    s.dawnSummary.push(`${p.name} a survécu à l'attaque… pour cette fois.`);
    return;
  }

  p.alive = false;
  p.deathCause = cause;
  s.dawnSummary.push(`${p.name} est mort — ${DEATH_LABEL[cause]}.`);
  s.log.push(`${p.name} (${ROLE_BY_ID[effectiveRoleId(p)].name}) — ${DEATH_LABEL[cause]}.`);

  // Capitaine : il désigne lui-même son successeur (pas de nouveau vote).
  if (p.isCaptain) {
    p.isCaptain = false;
    s.villageCaptainId = undefined;
    if (s.players.some((x) => x.alive && x.id !== p.id)) {
      s.captainSuccessionPending = p.id;
    }
  }

  // Ancien tué par le village
  if (
    effectiveRoleId(p) === "ancien" &&
    (cause === "VILLAGE_VOTE" || cause === "HUNTER_SHOT" || cause === "WITCH_POISON")
  ) {
    s.players
      .filter((x) => x.alive && x.team === "VILLAGEOIS")
      .forEach((x) => {
        x.powersDisabled = true;
      });
    s.dawnSummary.push(
      "L'Ancien est tombé par la main du village : tous les villageois perdent leurs pouvoirs.",
    );
  }

  // Enfant sauvage
  s.players
    .filter((x) => x.alive && x.roleModelId === p.id)
    .forEach((x) => {
      x.team = "WEREWOLVES";
      s.dawnSummary.push(`${x.name} sent la bête s'éveiller en lui…`);
    });

  // Général : son poids de vote reste de 1, aucune succession de poids.


  // Amoureux
  if (p.isLover) {
    const other = s.players.find((x) => x.isLover && x.id !== p.id && x.alive);
    if (other) killPlayer(s, other.id, "HEARTBREAK");
  }

  // Chasseur
  if (effectiveRoleId(p) === "chasseur" && !p.powersDisabled) {
    s.hunterPending = p.id;
  }
}

function resolveNight(state: GameState): GameState {
  const s = clone(state);
  s.dawnSummary = [];

  // Chaperon Rouge
  if (s.round.attackedId) {
    const victim = s.players.find((p) => p.id === s.round.attackedId)!;
    const hunterAlive = s.players.some(
      (p) => p.alive && effectiveRoleId(p) === "chasseur",
    );
    if (effectiveRoleId(victim) === "chaperon-rouge" && hunterAlive) {
      s.round.attackedId = undefined;
      s.dawnSummary.push(
        "Le Chaperon Rouge est resté sous la garde du Chasseur : l'attaque échoue.",
      );
    }
  }
  if (s.round.attackedId && s.round.attackedId === s.round.protectedId) {
    s.round.attackedId = undefined;
    s.dawnSummary.push("Le Salvateur a déjoué l'attaque des loups.");
  }
  if (s.round.attackedId && s.round.attackedId === s.round.jailedId) {
    s.round.attackedId = undefined;
    s.dawnSummary.push("Le prisonnier du Geôlier était hors d'atteinte.");
  }

  if (s.round.attackedId) killPlayer(s, s.round.attackedId, "WOLVES");
  if (s.round.whiteWolfKillId)
    killPlayer(s, s.round.whiteWolfKillId, "WHITE_WOLF_KILL");
  if (s.round.poisonedId) killPlayer(s, s.round.poisonedId, "WITCH_POISON");
  s.pendingDeaths.forEach((d) => killPlayer(s, d.id, d.cause));
  s.pendingDeaths = [];

  // Ours (nuit 1 uniquement, détection faite lors de son tour)
  if (s.round.bearGrowls) {
    s.dawnSummary.push("🐻 L'ours grogne : un loup est tout près !");
  }

  // Le mot du Loup Bavard est imposé pendant la nuit (dès la nuit 2).

  // Silence imposé par le Loup Noir
  s.players.forEach((p) => {
    p.mutedForDay = false;
  });
  if (s.round.mutedId) {
    const muted = s.players.find((p) => p.id === s.round.mutedId);
    if (muted && muted.alive) {
      muted.mutedForDay = true;
      s.dawnSummary.push(`${muted.name} est muet : il ne peut pas débattre aujourd'hui.`);
    }
  }

  // Tavernier effets du jour
  s.players.forEach((p) => {
    p.immuneToDayVote = false;
    p.baseVotes = 0;
  });
  if (s.round.drinkTargetId) {
    const d = s.players.find((p) => p.id === s.round.drinkTargetId);
    if (d) {
      d.immuneToDayVote = true;
      d.canVote = false;
    }
  }
  if (s.round.ravenTargetId) {
    const r = s.players.find((p) => p.id === s.round.ravenTargetId);
    if (r) r.baseVotes = 2;
  }

  if (s.dawnSummary.length === 0)
    s.dawnSummary.push("Étrangement, personne n'est mort cette nuit.");

  s.phase = s.hunterPending ? "EVENEMENT_MORT" : "AUBE";
  s.day = s.night;
  return checkVictory(s);
}

export function resolveHunter(state: GameState, targetId: string): GameState {
  const s = clone(state);
  s.hunterPending = undefined;
  killPlayer(s, targetId, "HUNTER_SHOT");
  s.phase = s.hunterPending ? "EVENEMENT_MORT" : s.day > 0 ? "AUBE" : "AUBE";
  return checkVictory(s);
}

export function goToVote(state: GameState): GameState {
  const s = clone(state);
  s.phase = "JOUR_VOTE";
  return s;
}

/** Le capitaine mourant désigne son successeur. */
export function assignCaptain(state: GameState, targetId: string): GameState {
  const s = clone(state);
  s.players.forEach((p) => {
    p.isCaptain = false;
    p.voteWeight = 1;
  });
  const next = s.players.find((p) => p.id === targetId && p.alive);
  if (next) {
    next.isCaptain = true;
    next.voteWeight = 2;
    s.villageCaptainId = next.id;
    s.log.push(`${next.name} devient le nouveau Capitaine.`);
  }
  s.captainSuccessionPending = undefined;
  return s;
}

/** Passe la nuit sans vote (uniquement possible le premier jour) */
export function skipVote(state: GameState): GameState {
  const s = clone(state);
  s.voteSkippedOffer = true;
  s.log.push("Jour 1 : le village a refusé de voter.");
  return startNight(s);
}

export function submitVote(
  state: GameState,
  targetId: string,
  talkativeSpoke = true,
): GameState {
  let s = clone(state);
  const target = s.players.find((p) => p.id === targetId);
  s.lastEliminated = [];

  if (target && !target.immuneToDayVote) {
    const roleId = effectiveRoleId(target);
    if (roleId === "ange" && s.day === 1) {
      s.phase = "FIN";
      s.winnerTeam = "OTHER";
      s.winner = `${target.name} — l'Ange gagne : le village l'a exécuté au premier jour.`;
      return s;
    }
    if (roleId === "idiot-du-village" && !target.abilityUsed) {
      target.abilityUsed = true;
      target.canVote = false;
      s.dawnSummary = [
        `${target.name} est l'Idiot du Village : il survit mais perd son droit de vote.`,
      ];
    } else {
      s.dawnSummary = [];
      killPlayer(s, target.id, "VILLAGE_VOTE");
      s.lastEliminated = [
        {
          id: target.id,
          name: target.name,
          roleId: target.originalRoleId ?? effectiveRoleId(target),
        },
      ];
    }
  } else if (target) {
    s.dawnSummary = [`${target.name} était intouchable aujourd'hui.`];
  }

  // Ange raté
  if (s.day === 1) {
    s.players
      .filter((p) => effectiveRoleId(p) === "ange" && p.alive)
      .forEach((p) => {
        p.roleId = "simple-villageois";
        p.copiedRoleId = undefined;
        p.team = "VILLAGEOIS";
      });
  }

  // Loup bavard
  if (!talkativeSpoke) {
    const talk = s.players.find(
      (p) => p.alive && effectiveRoleId(p) === "loup-bavard",
    );
    if (talk) killPlayer(s, talk.id, "TALKATIVE_WOLF");
  }

  s = checkVictory(s);
  if (s.phase === "FIN") return s;
  if (s.hunterPending) {
    s.phase = "EVENEMENT_MORT";
    return s;
  }
  return startNight(s);
}

/** Double égalité : tous les ex æquo sont éliminés. */
export function eliminateTied(
  state: GameState,
  ids: string[],
  talkativeSpoke = true,
): GameState {
  let s = clone(state);
  s.dawnSummary = [];
  s.lastEliminated = [];
  ids.forEach((id) => {
    const p = s.players.find((x) => x.id === id);
    if (!p || !p.alive || p.immuneToDayVote) return;
    killPlayer(s, id, "VILLAGE_VOTE");
    s.lastEliminated!.push({
      id: p.id,
      name: p.name,
      roleId: p.originalRoleId ?? effectiveRoleId(p),
    });
  });

  if (!talkativeSpoke) {
    const talk = s.players.find(
      (p) => p.alive && effectiveRoleId(p) === "loup-bavard",
    );
    if (talk) killPlayer(s, talk.id, "TALKATIVE_WOLF");
  }

  s = checkVictory(s);
  if (s.phase === "FIN") return s;
  if (s.hunterPending) {
    s.phase = "EVENEMENT_MORT";
    return s;
  }
  return startNight(s);
}

export function startNight(state: GameState): GameState {
  const s = clone(state);
  s.night += 1;
  s.phase = "NUIT";
  s.round = {
    previousProtectedId: state.round.protectedId,
    previousMutedId: state.round.mutedId,
  };
  s.stepIndex = 0;
  s.reveal = undefined;
  s.dawnSummary = [];
  s.players.forEach((p) => {
    p.disabledNightAbility = false;
  });
  s.steps = buildNightSteps(s);
  s.log.push(`— Nuit ${s.night} —`);
  return s;
}

export function checkVictory(state: GameState): GameState {
  const s = clone(state);
  const living = s.players.filter((p) => p.alive);
  if (living.length === 0) {
    s.phase = "FIN";
    s.winnerTeam = "OTHER";
    s.winner = "Personne ne survit. Le village est éteint.";
    return s;
  }

  const lovers = living.filter((p) => p.team === "LOVERS");
  if (lovers.length === 2 && living.length === 2) {
    s.phase = "FIN";
    s.winnerTeam = "OTHER";
    s.winner = `Les Amoureux gagnent : ${lovers[0].name} & ${lovers[1].name}.`;
    return s;
  }

  const whiteWolf = living.find((p) => effectiveRoleId(p) === "loup-blanc");
  if (whiteWolf && living.length === 1) {
    s.phase = "FIN";
    s.winnerTeam = "WOLVES";
    s.winner = `Le Loup Blanc ${whiteWolf.name} reste seul : victoire solitaire.`;
    return s;
  }

  const piper = living.find((p) => effectiveRoleId(p) === "joueur-de-flute");
  if (piper) {
    const enchanted = living.filter((p) => p.enchanted && p.id !== piper.id);
    if (enchanted.length === living.length - 1) {
      s.phase = "FIN";
      s.winnerTeam = "OTHER";
      s.winner = `Le Joueur de Flûte ${piper.name} a envoûté le village entier.`;
      return s;
    }
  }

  const wolves = living.filter((p) => p.team === "WEREWOLVES");
  if (wolves.length === 0) {
    s.phase = "FIN";
    s.winnerTeam = "VILLAGE";
    s.winner = "Le Village triomphe : plus aucun loup ne rôde.";
    return s;
  }
  if (wolves.length >= living.length - wolves.length) {
    s.phase = "FIN";
    s.winnerTeam = "WOLVES";
    s.winner = "Les Loups-Garous ont dévoré le village.";
    return s;
  }
  return s;
}