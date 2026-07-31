/** Dictionnaire français — source de vérité des clés de traduction. */
export const fr = {
  ui: {
    // Commun
    back: "← Retour",
    next: "Suivant",
    continue: "Continuer",
    loading: "Chargement…",
    quit: "Quitter",
    yes: "Oui",
    no: "Non",
    validate: "Valider",
    skip: "Passer",
    random: "🎲 Tirage au sort",
    language: "Langue",
    sound: "Son",
    soundOn: "Couper le son",
    soundOff: "Activer le son",
    offline: "100% hors-ligne",

    // Accueil
    tagline: "Le village s'endort…",
    newGame: "Nouvelle partie",
    grimoire: "Grimoire Des Rôles",
    footer: "Nightfall Oracle",
    logoAlt: "Loup hurlant devant une lune rose",

    // Grimoire
    grimoireTitle: "Le grimoire des rôles",
    grimoireHint:
      "Touche l'icône info d'une carte pour voir sa description puis son pouvoir.",
    narratorTitle: "Le Meneur du Jeu",
    narratorIntro:
      "Je suis le Meneur du Jeu. C'est moi qui réveille les âmes, compte les voix et annonce les morts. Suis mes instructions, le village n'a qu'une nuit d'avance sur les crocs.",
    infoRole: "Voir la description",
    powerLabel: "Pouvoir : ",

    // Setup
    setupTitle: "Noms des joueurs",
    playerNamePlaceholder: "Nom du joueur",
    addPlayer: "+ Ajouter un joueur",
    remove: "Supprimer",
    defaultPlayer: "Joueur",
    debateTimer: "Minuteur de débat",
    debateTimerDesc: "Chaque joueur dispose d'un temps de parole limité.",
    debateTimerToggle: "Activer le minuteur de débat",
    custom: "Perso.",
    perPlayerDebate: "{n}s par joueur pendant la phase de débat.",

    // Maître du jeu
    gmTitle: "Maître du Jeu",
    gmSubtitle:
      "Désignez le Maître du Jeu : il gardera le téléphone et guidera la partie. Il ne reçoit pas de carte rôle.",
    gmRandom: "🎲 Tirage au sort",
    gmNext: "Continuer",
    gmChosen: "Maître du Jeu",
    gmExcluded: "Le Maître du Jeu ne joue pas : {n} joueurs actifs.",

    // Composition
    compositionTitle: "Composition du village",
    compositionCount: "{r} rôle(s) sélectionné(s) pour {p} joueur(s).",
    distribute: "Distribuer les rôles",
    rolesProgress: "{r} / {p} rôles",

    // Distribution
    distributing: "Distribution en cours…",
    playerXofY: "Joueur {i} / {n}",
    passPhoneTo: "Passe le téléphone à {name}, puis dévoile la carte sans la montrer aux autres.",
    discoverRole: "Découvrir mon rôle",
    memorized: "J'ai mémorisé mon rôle",
    handoverTitle: "Passe le téléphone au Maître du Jeu",
    handoverText:
      "Les cartes sont distribuées. Je suis le meneur du jeu : à partir de maintenant, c'est moi qui garde le téléphone. Je guiderai les nuits, les aubes et les votes du village.",
    captainElection: "Élection du capitaine",
    captainElectionDesc:
      "Le village élit son capitaine à main levée. Son rôle secret reste caché : seul le meneur voit ce badge. Le Général ne peut pas être élu.",
    randomSelect: "🎲 Sélection aléatoire",
    noCaptain: "Jouer sans capitaine",
    startGame: "Commencer la partie",

    // Partie
    nightN: "Nuit {n}",
    dayN: "Jour {n}",
    village: "Village ({n} vivants)",
    mjDashboard: "Tableau du Maître du Jeu — rôles secrets visibles",
    nightEnds: "La nuit s'achève sur le village endormi.",
    raiseDay: "Lever le jour",
    captain: "Capitaine",
    captainX2: "Capitaine ×2",
    cannotVote: "ne vote pas",
    immune: "immunisé",
    wolfTag: "Loup",
    converted: " (converti)",
    convertedInfo: "Converti en Loup (info meneur)",

    // Nuit
    secretWordTitle: "Mot secret du Loup Bavard",
    secretWordHint:
      "Montre cet écran au Loup Bavard. Il devra prononcer ce mot pendant le débat du matin.",
    editWord: "Modifier le mot",
    bavardSeen: "Le Loup Bavard a vu son mot",
    packAgrees: "La meute est d'accord",
    disagreement: "Désaccord — la Matriarche tranche",
    infectPlayer: "Contaminer {name} (1× par partie)",
    muteTitle: "Imposer le silence (optionnel)",
    muteUnavailable: "Le pouvoir de silence est disponible à partir de la nuit 2.",
    bearNeighbors: "Voisins directs (info Maître du Jeu)",
    left: "Gauche",
    right: "Droite",
    infected: " (infecté)",
    bearSniff: "L'ours renifle les voisins",
    execPrisoner: "Exécuter le prisonnier",
    healSave: "Sauver {name}",
    poisonPotion: "Potion de mort (optionnel)",
    witchTargetProtected: "Le Salvateur protège déjà cette victime — la potion de vie est inutile.",

    // Aube & débat
    debateTitle: "Débat — Jour {n}",
    debateText:
      "Le capitaine ouvre les débats, chaque joueur s'exprime, puis le capitaine conclut.",
    mutedBy: "Réduit(s) au silence par le Loup Noir : {names}",
    dawnTitle: "Aube — Jour {n}",
    bavardWordOfDay: "Loup Bavard, ton mot du jour :",
    firstDayVoteQuestion:
      "Villageois, souhaitez-vous procéder au vote dès ce premier jour ? Ce matin seulement, le vote est facultatif.",
    vote: "Voter",
    noVote: "Pas de vote",
    forceVote: "Le meneur impose le vote du village",
    speaker: "Débat — orateur {i} / {n}",
    opening: "Ouverture",
    closing: "Conclusion",
    pause: "Pause",
    resume: "Reprendre",
    endDebate: "Fin du débat",
    extend30: "+30 s",

    // Vote
    voteTitle: "Vote du village — Jour {n}",
    revoteSuffix: " (revote)",
    voteText:
      "Le village doit désigner un condamné. Comptez les voix : au moins un joueur doit être éliminé.",
    voteTotal: "Total attribué : {c} / {t} voix",
    voteTotalHint:
      "Le total des voix possibles est égal au nombre de vivants + 1 (double voix du Capitaine).",
    addVote: "Ajouter une voix à {name}",
    removeVote: "Retirer une voix à {name}",
    bavardCheck: "Vérification — Loup Bavard",
    bavardAsk: "A-t-il prononcé son mot {word} ?",
    bavardInactiveDay1: "Le Loup Bavard était inactif la nuit 1 — pas de vérification.",
    tieJudge:
      "Égalité : le Juge arbitre. Il désigne un ou plusieurs ex æquo à éliminer, ou ordonne un revote.",
    judgeExecute: "Exécuter la sentence du Juge",
    orderRevote: "Ordonner un revote",
    tieNote:
      "En cas de seconde égalité après revote, tous les ex æquo sont éliminés.",
    validateExec: "Valider l'exécution",

    // Événements
    captainSuccession: "Succession du Capitaine",
    captainSuccessionText:
      "{name} tombe. Avant de partir, il désigne lui-même son successeur : il n'y a pas de nouveau vote.",
    transmit: "Transmettre le capitanat",
    hunterTitle: "Dernier souffle du Chasseur",
    hunterText: "Le Chasseur s'effondre, mais son fusil parle une dernière fois.",
    shoot: "Tirer",
    eliminated: "Éliminé",
    villageStrikes: "Le village frappe fort",
    villageDecided: "Le village a tranché",

    // Transitions
    nightFalls: "La nuit tombe",
    dayRises: "Le jour se lève",
    tapToContinue: "Toucher pour continuer",
    nightSubtitle: "Nuit {n} — que tout le monde ferme les yeux",
    daySubtitle: "Jour {n} — le village se réveille",

    // Bilan de Partie
    bilanTitle: "Bilan de Partie",
    bilanMvp: "⭐ MVP de la partie",
    bilanMvpScore: "{n} pts",
    bilanVoteHistory: "Historique des votes",
    bilanDayVote: "Jour {n}",
    bilanRevoteSuffix: " (revote)",
    bilanElim: "→ {names}",
    bilanNobodyElim: "→ Personne",
    bilanTeamDomination: "Domination stratégique",
    bilanVillageCtrl: "🏘️ Village : {pct}%",
    bilanWolfCtrl: "🐺 Loups : {pct}%",
    bilanBalanced: "Partie très équilibrée",
    bilanDuration: "{d} jour(s) de partie",
    bilanSurvivors: "Survivants : {n}",
    bilanNoVotes: "Aucun vote n'a été enregistré.",

    // Fin
    gameOver: "Fin de la partie",
    gameOverFallback: "La partie est terminée.",
    recap: "Récapitulatif",
    colPlayer: "Joueur",
    colRole: "Rôle",
    colTeam: "Camp",
    colStatus: "Statut",
    statusAlive: "Vivant",
    statusDead: "Mort",

    // Orientation
    rotateTitle: "Tourne ton téléphone",
    rotateText:
      "Nightfall Oracle se joue en mode portrait. Remets ton appareil à la verticale pour continuer la partie.",
  },
  prompts: {
    cupidon: "Désigne les deux amoureux.",
    mime: "Choisis le joueur dont tu copies le rôle.",
    "enfant-sauvage": "Choisis ton modèle.",
    geolier: "Qui séquestres-tu cette nuit ?",
    voyante: "Quel joueur veux-tu sonder ?",
    salvateur: "Qui protèges-tu cette nuit ? (jamais deux fois de suite)",
    "petite-fille": "Tu entrouvres les yeux… veux-tu espionner la meute ?",
    "loup-garou":
      "La meute désigne sa victime. En cas de désaccord, la Matriarche tranchera seule.",
    "loup-noir":
      "Contamine la victime (une fois par partie) et/ou impose le silence à un joueur.",
    "loup-blanc": "Veux-tu dévorer un loup cette nuit ?",
    "loup-bavard":
      "Le Maître du Jeu montre le mot secret : il devra être prononcé pendant le débat du matin.",
    sorciere: "Utilise tes potions.",
    "joueur-de-flute": "Enchante deux joueurs.",
    corbeau: "Sur qui déposes-tu la plume noire ?",
    tavernier: "À qui offres-tu un verre ?",
    general: "Désigne le joueur que tu veux abattre. Si ce n'est pas un loup, tu meurs.",
    "montreur-dours": "L'ours flaire ses voisins…",
  } as Record<string, string>,
  teams: {
    VILLAGEOIS: "Village",
    WEREWOLVES: "Loups-Garous",
    SOLO: "Solitaire",
    LOVERS: "Amoureux",
  } as Record<string, string>,
  /** Les rôles français viennent directement de src/data/roles.ts. */
  roles: {} as Record<string, { name: string; description: string; power: string }>,
};

export type UiKey = keyof typeof fr.ui;
export type Dictionary = typeof fr;
