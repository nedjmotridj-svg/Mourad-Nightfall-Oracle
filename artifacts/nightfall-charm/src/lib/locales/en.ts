import type { Dictionary } from "./fr";

export const en: Dictionary = {
  ui: {
    back: "← Back",
    next: "Next",
    continue: "Continue",
    loading: "Loading…",
    quit: "Quit",
    yes: "Yes",
    no: "No",
    validate: "Confirm",
    skip: "Skip",
    random: "🎲 Random pick",
    language: "Language",
    sound: "Sound",
    soundOn: "Mute sound",
    soundOff: "Unmute sound",
    offline: "100% offline",

    tagline: "The village falls asleep…",
    newGame: "New game",
    grimoire: "Grimoire of Roles",
    footer: "Nightfall Oracle",
    logoAlt: "Wolf howling in front of a pink moon",

    grimoireTitle: "The grimoire of roles",
    grimoireHint: "Tap a card's info icon to see its description and power.",
    narratorTitle: "The Game Master",
    narratorIntro:
      "I am the Game Master. I wake the souls, count the votes and announce the dead. Follow my instructions — the village is only one night ahead of the fangs.",
    infoRole: "View description",
    powerLabel: "Power: ",

    setupTitle: "Player names",
    playerNamePlaceholder: "Player name",
    addPlayer: "+ Add a player",
    remove: "Remove",
    defaultPlayer: "Player",
    debateTimer: "Debate timer",
    debateTimerDesc: "Each player gets a limited speaking time.",
    debateTimerToggle: "Enable the debate timer",
    custom: "Custom",
    perPlayerDebate: "{n}s per player during the debate phase.",

    gmTitle: "Game Master",
    gmSubtitle:
      "Choose the Game Master: they keep the phone and guide the game. They do not receive a role card.",
    gmRandom: "🎲 Random pick",
    gmNext: "Continue",
    gmChosen: "Game Master",
    gmExcluded: "The Game Master does not play: {n} active players.",

    compositionTitle: "Village composition",
    compositionCount: "{r} role(s) selected for {p} player(s).",
    distribute: "Deal the roles",
    rolesProgress: "{r} / {p} roles",

    distributing: "Dealing cards…",
    playerXofY: "Player {i} / {n}",
    passPhoneTo:
      "Pass the phone to {name}, then reveal the card without showing it to the others.",
    discoverRole: "Reveal my role",
    memorized: "I memorised my role",
    handoverTitle: "Hand the phone to the Game Master",
    handoverText:
      "The cards are dealt. I am the Game Master: from now on I keep the phone. I will guide the nights, the dawns and the village votes.",
    captainElection: "Captain election",
    captainElectionDesc:
      "The village elects its captain by a show of hands. Their secret role stays hidden: only the Game Master sees this badge. The General cannot be elected.",
    randomSelect: "🎲 Random selection",
    noCaptain: "Play without a captain",
    startGame: "Start the game",

    nightN: "Night {n}",
    dayN: "Day {n}",
    village: "Village ({n} alive)",
    mjDashboard: "Game Master board — secret roles visible",
    nightEnds: "The night ends over the sleeping village.",
    raiseDay: "Raise the day",
    captain: "Captain",
    captainX2: "Captain ×2",
    cannotVote: "cannot vote",
    immune: "immune",
    wolfTag: "Wolf",
    converted: " (converted)",
    convertedInfo: "Converted to Wolf (GM info)",

    secretWordTitle: "Talkative Wolf's secret word",
    secretWordHint:
      "Show this screen to the Talkative Wolf. They must say this word during the morning debate.",
    editWord: "Edit the word",
    bavardSeen: "The Talkative Wolf has seen the word",
    packAgrees: "The pack agrees",
    disagreement: "Disagreement — the Matriarch decides",
    infectPlayer: "Infect {name} (once per game)",
    muteTitle: "Impose silence (optional)",
    muteUnavailable: "The silence power is available from night 2 onwards.",
    bearNeighbors: "Direct neighbours (GM info)",
    left: "Left",
    right: "Right",
    infected: " (infected)",
    bearSniff: "The bear sniffs the neighbours",
    execPrisoner: "Execute the prisoner",
    healSave: "Save {name}",
    poisonPotion: "Death potion (optional)",

    debateTitle: "Debate — Day {n}",
    debateText:
      "The captain opens the debate, every player speaks, then the captain concludes.",
    mutedBy: "Silenced by the Black Wolf: {names}",
    dawnTitle: "Dawn — Day {n}",
    bavardWordOfDay: "Talkative Wolf, your word of the day:",
    firstDayVoteQuestion:
      "Villagers, do you want to vote on this very first day? This morning only, the vote is optional.",
    vote: "Vote",
    noVote: "No vote",
    forceVote: "The Game Master forces the village vote",
    speaker: "Debate — speaker {i} / {n}",
    opening: "Opening",
    closing: "Closing",
    pause: "Pause",
    resume: "Resume",
    endDebate: "End the debate",

    voteTitle: "Village vote — Day {n}",
    revoteSuffix: " (revote)",
    voteText:
      "The village must condemn someone. Count the votes: at least one player must be eliminated.",
    voteTotal: "Votes cast: {c} / {t}",
    voteTotalHint:
      "The total number of possible votes equals the number of living players + 1 (the Captain's double vote).",
    addVote: "Add a vote to {name}",
    removeVote: "Remove a vote from {name}",
    bavardCheck: "Check — Talkative Wolf",
    bavardAsk: "Did they say their word {word}?",
    tieJudge:
      "Tie: the Judge arbitrates. They pick one or more tied players to eliminate, or order a revote.",
    judgeExecute: "Carry out the Judge's sentence",
    orderRevote: "Order a revote",
    tieNote: "If the revote ties again, every tied player is eliminated.",
    validateExec: "Confirm the execution",

    captainSuccession: "Captain succession",
    captainSuccessionText:
      "{name} falls. Before leaving, they name their own successor: there is no new vote.",
    transmit: "Hand over the captaincy",
    hunterTitle: "The Hunter's last breath",
    hunterText: "The Hunter collapses, but his rifle speaks one last time.",
    shoot: "Shoot",
    eliminated: "Eliminated",
    villageStrikes: "The village strikes hard",
    villageDecided: "The village has decided",

    nightFalls: "Night falls",
    dayRises: "Day rises",
    tapToContinue: "Tap to continue",
    nightSubtitle: "Night {n} — everyone close your eyes",
    daySubtitle: "Day {n} — the village wakes up",

    gameOver: "Game over",
    gameOverFallback: "The game is over.",
    recap: "Summary",
    colPlayer: "Player",
    colRole: "Role",
    colTeam: "Team",
    colStatus: "Status",
    statusAlive: "Alive",
    statusDead: "Dead",

    rotateTitle: "Rotate your phone",
    rotateText:
      "Nightfall Oracle is played in portrait mode. Turn your device upright to continue the game.",
  },
  prompts: {
    cupidon: "Choose the two lovers.",
    mime: "Choose the player whose role you copy.",
    "enfant-sauvage": "Choose your role model.",
    geolier: "Who do you lock up tonight?",
    voyante: "Which player do you want to inspect?",
    salvateur: "Who do you protect tonight? (never twice in a row)",
    "petite-fille": "You open your eyes a little… do you want to spy on the pack?",
    "loup-garou":
      "The pack designates its victim. In case of disagreement, the Matriarch decides alone.",
    "loup-noir":
      "Infect the victim (once per game) and/or impose silence on a player.",
    "loup-blanc": "Do you want to devour a wolf tonight?",
    "loup-bavard":
      "The Game Master shows the secret word: it must be said during the morning debate.",
    sorciere: "Use your potions.",
    "joueur-de-flute": "Charm two players.",
    corbeau: "Who do you mark with the black feather?",
    tavernier: "Who do you offer a drink to?",
    general: "Name the player you want to shoot. If they are not a wolf, you die.",
    "montreur-dours": "The bear sniffs its neighbours…",
  },
  teams: {
    VILLAGEOIS: "Village",
    WEREWOLVES: "Werewolves",
    SOLO: "Solo",
    LOVERS: "Lovers",
  },
  roles: {
    "loup-garou": {
      name: "Werewolf",
      description:
        "A cursed creature blending in with the villagers by day and prowling by night. The pack recognises each other in the dark and hunts as one.",
      power:
        "Each night the pack votes and designates a single victim, marked as attacked by the wolves.",
    },
    "loup-noir": {
      name: "Black Wolf",
      description:
        "A shadow wolf able to infect rather than devour. His breath turns the victim into a member of the pack.",
      power:
        "Once per game, after the wolves' vote: the victim is not killed but joins the Wolves while keeping their original power.",
    },
    "loup-blanc": {
      name: "White Wolf",
      description:
        "A lone ash-furred wolf. He hunts with the pack but dreams of being the last one standing.",
      power:
        "Every other night (even nights), after the wolves' vote, he may devour a wolf. He wins if he is the sole survivor.",
    },
    "loup-bavard": {
      name: "Talkative Wolf",
      description:
        "A wolf with too long a tongue: he must speak to survive, at the risk of betraying himself.",
      power:
        "At dawn he receives an imposed word. If he has not said it before the end of the day, he dies.",
    },
    "loup-matriarche": {
      name: "Matriarch Wolf",
      description: "Mother of the pack, her word is law when the fangs hesitate.",
      power:
        "If the wolves' vote is tied, her choice alone sets the target of the night.",
    },
    "simple-villageois": {
      name: "Villager",
      description:
        "An ordinary soul of the village, without power but not without a voice. Insight is their only weapon.",
      power: "No night action. Day vote with a weight of 1.",
    },
    "enfant-sauvage": {
      name: "Wild Child",
      description:
        "Raised by beasts, he looks for a human model. If that model falls, the beast takes over.",
      power:
        "Night 1: chooses a model. When the model dies, he switches to the Wolves from the following night.",
    },
    "petite-fille": {
      name: "Little Girl",
      description:
        "Curious to the point of recklessness, she peeks while the wolves are awake.",
      power:
        "Each night she spies on the pack and gets partial information. She risks being spotted: immediate death.",
    },
    "chaperon-rouge": {
      name: "Little Red Riding Hood",
      description:
        "Protected by the Hunter's shadow, her red cloak keeps the fangs away as long as the rifle watches.",
      power: "At dawn: if the Hunter is alive, the wolf attack against her is cancelled.",
    },
    voyante: {
      name: "Seer",
      description:
        "Her visions pierce every mask. She knows, but speaking too soon condemns her.",
      power: "Each night she inspects a player and discovers their exact role.",
    },
    sorciere: {
      name: "Witch",
      description: "Keeper of two vials: one gives life, the other takes it away.",
      power:
        "After the wolves: healing potion (cancels the attack, 1×) and death potion (poisons a target, 1×).",
    },
    chasseur: {
      name: "Hunter",
      description: "He never leaves alone: his last breath is a gunshot.",
      power: "On his death, he designates a player who dies immediately.",
    },
    cupidon: {
      name: "Cupid",
      description:
        "He weaves a fatal bond between two hearts: their fates become inseparable.",
      power:
        "Night 1: links two players. Different camps → Lovers camp. If one dies, the other dies of grief.",
    },
    ancien: {
      name: "Elder",
      description:
        "Memory of the village, he has already survived a thousand nights. Killing him by mistake breaks the village.",
      power:
        "Survives a first wolf attack (2 lives). If the village kills him, all villagers lose their powers.",
    },
    salvateur: {
      name: "Defender",
      description: "Silent shield of the village, he watches over one house each night.",
      power:
        "Protects a player (never the same two nights in a row): the wolf attack is cancelled.",
    },
    "idiot-du-village": {
      name: "Village Idiot",
      description:
        "People laugh at him, accuse him, but do not dare hang him twice.",
      power:
        "If executed by the vote, he survives once, but permanently loses his right to vote.",
    },
    "joueur-de-flute": {
      name: "Pied Piper",
      description:
        "His melody creeps into minds until it possesses the whole village.",
      power:
        "Each night he charms 2 players. He wins when every living player but him is charmed.",
    },
    ange: {
      name: "Angel",
      description:
        "Fallen, he dreams only of immediate martyrdom at the hands of the village.",
      power:
        "If executed on the village's first vote, he wins instantly. Otherwise he becomes a plain Villager.",
    },
    tavernier: {
      name: "Innkeeper",
      description:
        "His wine clouds the mind: whoever drinks is untouchable but unheard.",
      power:
        "Offers a drink to a player: the next day they are immune to the village vote but cannot vote.",
    },
    corbeau: {
      name: "Raven",
      description: "An ill-omened messenger, he marks a door with a black feather.",
      power: "Designates a player: they start the next day's vote with 2 votes.",
    },
    general: {
      name: "General",
      description:
        "A man of strategy and firm conviction, the General cannot stand the village's indecision. He is convinced he can flush out a wolf — even at the cost of his own life.",
      power:
        "Once per game (on night 2 or 3 at the latest), he names a player to shoot at night. If the target is a Werewolf, the General becomes the new Captain. Otherwise the General is eliminated by the Game Master and the target survives.",
    },
    mime: {
      name: "Mime",
      description: "He imitates until he becomes the other, without ever saying a word.",
      power: "Night 1: copies a player's role for the rest of the game.",
    },
    geolier: {
      name: "Jailer",
      description:
        "He locks up a suspect for the night: safe from the fangs, but at his mercy.",
      power:
        "Locks up a player: night power disabled and immunity to attacks. He may choose to execute them.",
    },
    "montreur-dours": {
      name: "Bear Tamer",
      description:
        "Guided by animal instinct, the Bear immediately senses evil around it when the village wakes.",
      power:
        "Plays on the first night only. The Game Master sees the names and roles of your two direct neighbours. If at least one neighbour is a Werewolf, or if the Bear is infected, the Bear growls.",
    },
    juge: {
      name: "Judge",
      description:
        "Guardian of the village law, he decides when the votes tear each other apart.",
      power:
        "On a tied village vote: he designates one of the tied players to be executed, or orders a revote. If the revote ties again, all tied players perish.",
    },
  },
};
