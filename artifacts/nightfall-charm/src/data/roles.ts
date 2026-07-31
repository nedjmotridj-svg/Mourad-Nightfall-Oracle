export type Team = "VILLAGEOIS" | "WEREWOLVES" | "SOLO" | "LOVERS";

export interface RoleDef {
  id: string;
  name: string;
  team: Team;
  description: string;
  power: string;
  /** night priority, lower = earlier. 0 = no night action */
  order: number;
  firstNightOnly?: boolean;
  hasNightAction: boolean;
}

const images = import.meta.glob("../assets/roles/*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export function roleImage(id: string): string {
  const key = Object.keys(images).find((k) => k.endsWith(`/${id}.jpg`));
  return key ? images[key] : "";
}

export const ROLES: RoleDef[] = [
  {
    id: "loup-garou",
    name: "Loup-Garou",
    team: "WEREWOLVES",
    description:
      "Créature maudite qui se fond parmi les villageois le jour et rôde la nuit. La meute se reconnaît dans l'obscurité et chasse d'une seule voix.",
    power:
      "Chaque nuit, la meute vote et désigne une victime unique : la cible est marquée comme attaquée par les loups.",
    order: 40,
    hasNightAction: true,
  },
  {
    id: "loup-noir",
    name: "Loup Noir",
    team: "WEREWOLVES",
    description:
      "Loup d'ombre capable de contaminer plutôt que de dévorer. Son souffle transforme la victime en membre de la meute.",
    power:
      "Une fois par partie, après le vote des loups : la victime n'est pas tuée mais rejoint le camp des Loups en conservant son pouvoir d'origine.",
    order: 41,
    hasNightAction: true,
  },
  {
    id: "loup-blanc",
    name: "Loup Blanc",
    team: "SOLO",
    description:
      "Loup solitaire au pelage de cendre. Il chasse avec la meute mais rêve de rester le dernier debout.",
    power:
      "Une nuit sur deux (nuits paires), après le vote des loups, il peut dévorer un loup. Il gagne s'il est le seul survivant.",
    order: 42,
    hasNightAction: true,
  },
  {
    id: "loup-bavard",
    name: "Loup Bavard",
    team: "WEREWOLVES",
    description:
      "Loup à la langue trop longue : il doit parler pour survivre, au risque de se trahir lui-même.",
    power:
      "À l'aube il reçoit un mot imposé. S'il ne l'a pas prononcé avant la fin du jour, il meurt.",
    order: 43,
    hasNightAction: false,
  },
  {
    id: "loup-matriarche",
    name: "Loup Matriarche",
    team: "WEREWOLVES",
    description:
      "Mère de la meute, sa parole fait loi quand les crocs hésitent.",
    power:
      "En cas d'égalité lors du vote des loups, son choix fixe seul la cible de la nuit.",
    order: 39,
    hasNightAction: true,
  },
  {
    id: "simple-villageois",
    name: "Simple Villageois",
    team: "VILLAGEOIS",
    description:
      "Âme ordinaire du village, sans pouvoir mais pas sans voix. Sa lucidité est sa seule arme.",
    power: "Aucune action nocturne. Vote de jour avec un poids de 1.",
    order: 0,
    hasNightAction: false,
  },
  {
    id: "enfant-sauvage",
    name: "Enfant Sauvage",
    team: "VILLAGEOIS",
    description:
      "Élevé par les bêtes, il cherche un modèle humain. Si ce modèle tombe, la bête reprend le dessus.",
    power:
      "Nuit 1 : choisit un modèle. À la mort de son modèle, il bascule dans le camp des Loups dès la nuit suivante.",
    order: 12,
    firstNightOnly: true,
    hasNightAction: true,
  },
  {
    id: "petite-fille",
    name: "Petite Fille",
    team: "VILLAGEOIS",
    description:
      "Curieuse jusqu'à l'imprudence, elle entrouvre les yeux quand les loups se réveillent.",
    power:
      "Chaque nuit, elle espionne la meute et reçoit une information partielle. Risque d'être repérée : mort immédiate.",
    order: 35,
    hasNightAction: true,
  },
  {
    id: "chaperon-rouge",
    name: "Chaperon Rouge",
    team: "VILLAGEOIS",
    description:
      "Protégée par l'ombre du Chasseur, sa cape rouge éloigne les crocs tant que le fusil veille.",
    power:
      "À l'aube : si le Chasseur est vivant, l'attaque des loups la concernant est annulée.",
    order: 0,
    hasNightAction: false,
  },
  {
    id: "voyante",
    name: "Voyante",
    team: "VILLAGEOIS",
    description:
      "Ses visions percent les masques. Elle sait, mais parler trop tôt la condamne.",
    power: "Chaque nuit, elle inspecte un joueur et découvre son rôle exact.",
    order: 20,
    hasNightAction: true,
  },
  {
    id: "sorciere",
    name: "Sorcière",
    team: "VILLAGEOIS",
    description:
      "Gardienne de deux fioles : l'une rend la vie, l'autre l'arrache.",
    power:
      "Après les loups : potion de soin (annule l'attaque, 1×) et potion de mort (empoisonne une cible, 1×).",
    order: 50,
    hasNightAction: true,
  },
  {
    id: "chasseur",
    name: "Chasseur",
    team: "VILLAGEOIS",
    description:
      "Il ne part jamais seul : son dernier souffle est un coup de feu.",
    power: "À sa mort, il désigne un joueur qui meurt immédiatement.",
    order: 0,
    hasNightAction: false,
  },
  {
    id: "cupidon",
    name: "Cupidon",
    team: "VILLAGEOIS",
    description:
      "Il tisse un lien fatal entre deux cœurs : leur destin devient indissociable.",
    power:
      "Nuit 1 : lie deux joueurs. Camps différents → camp des Amoureux. Si l'un meurt, l'autre meurt de chagrin.",
    order: 10,
    firstNightOnly: true,
    hasNightAction: true,
  },
  {
    id: "ancien",
    name: "Ancien",
    team: "VILLAGEOIS",
    description:
      "Mémoire du village, il a déjà survécu à mille nuits. Le tuer par erreur brise le village.",
    power:
      "Résiste à une première attaque des loups (2 vies). S'il est tué par le village, tous les villageois perdent leurs pouvoirs.",
    order: 0,
    hasNightAction: false,
  },
  {
    id: "salvateur",
    name: "Salvateur",
    team: "VILLAGEOIS",
    description:
      "Bouclier silencieux du village, il veille sur une maison chaque nuit.",
    power:
      "Protège un joueur (jamais le même deux nuits d'affilée) : l'attaque des loups est annulée.",
    order: 30,
    hasNightAction: true,
  },
  {
    id: "idiot-du-village",
    name: "Idiot du Village",
    team: "VILLAGEOIS",
    description:
      "On rit de lui, on l'accuse, mais on n'ose pas le pendre deux fois.",
    power:
      "S'il est exécuté par le vote, il survit une fois, mais perd définitivement son droit de vote.",
    order: 0,
    hasNightAction: false,
  },
  {
    id: "joueur-de-flute",
    name: "Joueur de Flûte",
    team: "SOLO",
    description:
      "Sa mélodie s'insinue dans les esprits jusqu'à posséder le village entier.",
    power:
      "Chaque nuit, il enchante 2 joueurs. Il gagne quand tous les vivants sauf lui sont enchantés.",
    order: 60,
    hasNightAction: true,
  },
  {
    id: "ange",
    name: "Ange",
    team: "SOLO",
    description:
      "Déchu, il ne rêve que d'un martyre immédiat sous les mains du village.",
    power:
      "S'il est exécuté au premier vote du village, il gagne instantanément. Sinon il devient Simple Villageois.",
    order: 0,
    hasNightAction: false,
  },
  {
    id: "tavernier",
    name: "Tavernier",
    team: "VILLAGEOIS",
    description:
      "Son vin trouble les esprits : celui qui boit est intouchable mais inaudible.",
    power:
      "Offre un verre à un joueur : le jour suivant il est immunisé au vote du village mais ne peut pas voter.",
    order: 62,
    hasNightAction: true,
  },
  {
    id: "corbeau",
    name: "Corbeau",
    team: "VILLAGEOIS",
    description:
      "Messager de mauvais augure, il marque une porte d'une plume noire.",
    power: "Désigne un joueur : il commence le vote du jour suivant avec 2 voix.",
    order: 61,
    hasNightAction: true,
  },
  {
    id: "general",
    name: "Général",
    team: "VILLAGEOIS",
    description:
      "Homme de stratégie et de ferme conviction, le Général ne supporte pas l'indécision du village. Il est persuadé de pouvoir débusquer un loup parmi les siens – quitte à risquer sa propre vie sur ce coup d'audace.",
    power:
      "Une fois par partie (entre le tour 2 et le tour 3 au plus tard), désigne un joueur à abattre la nuit. Si la cible est un Loup-Garou, le Général devient le nouveau Capitaine du village. Sinon, le Général est déclaré éliminé par le Maître du Jeu et la cible reste en vie.",
    order: 45,
    hasNightAction: true,
  },
  {
    id: "mime",
    name: "Mime",
    team: "VILLAGEOIS",
    description:
      "Il imite jusqu'à devenir l'autre, sans jamais prononcer un mot.",
    power: "Nuit 1 : copie le rôle d'un joueur pour le reste de la partie.",
    order: 11,
    firstNightOnly: true,
    hasNightAction: true,
  },
  {
    id: "geolier",
    name: "Geôlier",
    team: "VILLAGEOIS",
    description:
      "Il enferme un suspect pour la nuit : à l'abri des crocs, mais à sa merci.",
    power:
      "Séquestre un joueur : pouvoir nocturne désactivé et immunité aux attaques. Il peut choisir de l'exécuter.",
    order: 15,
    hasNightAction: true,
  },
  {
    id: "montreur-dours",
    name: "Montreur d'Ours",
    team: "VILLAGEOIS",
    description:
      "Guidé par son instinct animal, l'Ours ressent immédiatement la présence du mal autour de lui dès le réveil du village.",
    power:
      "Joue uniquement la première nuit. Le Maître du Jeu voit les noms et rôles de vos deux voisins directs. Si au moins un voisin est un Loup-Garou ou si l'Ours est infecté, l'Ours grogne. Sinon, tout va bien.",
    order: 99,
    firstNightOnly: true,
    hasNightAction: true,
  },
  {
    id: "juge",
    name: "Juge",
    team: "VILLAGEOIS",
    description:
      "Gardien de la loi du village, il tranche quand les voix se déchirent à égalité.",
    power:
      "En cas d'égalité au vote du village : il désigne un des ex æquo à exécuter, ou ordonne un revote. Si le revote est encore à égalité, tous les ex æquo périssent.",
    order: 0,
    hasNightAction: false,
  },
];

export const ROLE_BY_ID: Record<string, RoleDef> = Object.fromEntries(
  ROLES.map((r) => [r.id, r]),
);

export const TEAM_LABEL: Record<Team, string> = {
  VILLAGEOIS: "Village",
  WEREWOLVES: "Loups",
  SOLO: "Solitaire",
  LOVERS: "Amoureux",
};