/* Vie étudiante : profils de programmes (cours d'une 1re session et leur pondération),
 * repères de temps et événements de la simulation d'une session.
 *
 * Cégep : chaque cours a une pondération « théorie-pratique-travail personnel » (ex. 3-2-3 = 3 h de cours,
 * 2 h de laboratoire et 3 h de travail personnel par semaine). Les pondérations sont celles des devis
 * ministériels habituels ; elles varient un peu selon le cégep.
 * Université : 1 crédit = 45 heures de travail par session, donc un cours de 3 crédits ≈ 9 h par semaine
 * (cours, laboratoires et travail personnel). Session de 15 semaines.
 */

CE.VIE = {
  semaines: 15,
  relache: 8,          // semaine de relâche ou de lecture (ou de mise à jour au cégep)
  examens: [7, 15],    // mi-session et fin de session

  profils: {
    "cegep-sciences": { niveau: "cegep", nom: "Sciences de la nature", ville: "cegep",
      cours: [
        { n: "Écriture et littérature", t: 2, l: 2, p: 3, fg: true },
        { n: "Philosophie et rationalité", t: 3, l: 1, p: 3, fg: true },
        { n: "Anglais", t: 2, l: 1, p: 3, fg: true },
        { n: "Activité physique et santé", t: 1, l: 1, p: 1, fg: true },
        { n: "Calcul différentiel", t: 3, l: 2, p: 3 },
        { n: "Chimie générale", t: 3, l: 2, p: 3, labo: "Laboratoire de chimie" },
        { n: "Mécanique (physique)", t: 3, l: 2, p: 3, labo: "Laboratoire de physique" },
      ] },
    "cegep-humaines": { niveau: "cegep", nom: "Sciences humaines",
      cours: [
        { n: "Écriture et littérature", t: 2, l: 2, p: 3, fg: true },
        { n: "Philosophie et rationalité", t: 3, l: 1, p: 3, fg: true },
        { n: "Anglais", t: 2, l: 1, p: 3, fg: true },
        { n: "Activité physique et santé", t: 1, l: 1, p: 1, fg: true },
        { n: "Initiation à la psychologie", t: 2, l: 1, p: 3 },
        { n: "Histoire de la civilisation occidentale", t: 2, l: 1, p: 3 },
        { n: "Économie globale", t: 2, l: 1, p: 3 },
        { n: "Méthodologie des sciences humaines", t: 2, l: 2, p: 2 },
      ] },
    "cegep-arts": { niveau: "cegep", nom: "Arts, lettres et communication",
      cours: [
        { n: "Écriture et littérature", t: 2, l: 2, p: 3, fg: true },
        { n: "Philosophie et rationalité", t: 3, l: 1, p: 3, fg: true },
        { n: "Anglais", t: 2, l: 1, p: 3, fg: true },
        { n: "Activité physique et santé", t: 1, l: 1, p: 1, fg: true },
        { n: "Littérature et culture", t: 2, l: 1, p: 3 },
        { n: "Langage des médias", t: 2, l: 2, p: 2 },
        { n: "Atelier de création", t: 1, l: 3, p: 2, labo: "Atelier de création" },
      ] },
    "cegep-infirmier": { niveau: "cegep", nom: "Soins infirmiers (technique)",
      cours: [
        { n: "Écriture et littérature", t: 2, l: 2, p: 3, fg: true },
        { n: "Anglais", t: 2, l: 1, p: 3, fg: true },
        { n: "Activité physique et santé", t: 1, l: 1, p: 1, fg: true },
        { n: "Biologie humaine", t: 3, l: 2, p: 2, labo: "Laboratoire de biologie" },
        { n: "Fondements des soins infirmiers", t: 3, l: 3, p: 3, labo: "Laboratoire de soins" },
        { n: "Développement de la personne", t: 2, l: 1, p: 2 },
        { n: "Stage en milieu de soins", t: 0, l: 6, p: 1, stage: true, labo: "Stage à l'hôpital" },
      ] },
    "cegep-informatique": { niveau: "cegep", nom: "Techniques de l'informatique",
      cours: [
        { n: "Écriture et littérature", t: 2, l: 2, p: 3, fg: true },
        { n: "Philosophie et rationalité", t: 3, l: 1, p: 3, fg: true },
        { n: "Anglais", t: 2, l: 1, p: 3, fg: true },
        { n: "Activité physique et santé", t: 1, l: 1, p: 1, fg: true },
        { n: "Programmation I", t: 2, l: 4, p: 3, labo: "Laboratoire de programmation" },
        { n: "Systèmes d'exploitation", t: 2, l: 2, p: 2 },
        { n: "Mathématiques appliquées", t: 2, l: 2, p: 2 },
      ] },
    "uni-genie": { niveau: "uni", nom: "Génie (1re année, 15 crédits)",
      cours: [
        { n: "Calcul I", t: 3, l: 2, p: 4, labo: "Travaux dirigés de calcul" },
        { n: "Mécanique pour ingénieurs", t: 3, l: 2, p: 4, labo: "Travaux dirigés de mécanique" },
        { n: "Programmation", t: 3, l: 2, p: 4, labo: "Laboratoire de programmation" },
        { n: "Chimie des matériaux", t: 3, l: 2, p: 4, labo: "Laboratoire de chimie" },
        { n: "Projet d'introduction au génie", t: 2, l: 2, p: 5, labo: "Atelier de projet" },
      ] },
    "uni-sciences": { niveau: "uni", nom: "Biologie ou sciences biomédicales (15 crédits)",
      cours: [
        { n: "Biologie cellulaire", t: 3, l: 3, p: 3, labo: "Laboratoire de biologie" },
        { n: "Chimie organique", t: 3, l: 3, p: 3, labo: "Laboratoire de chimie" },
        { n: "Biostatistiques", t: 3, l: 0, p: 6 },
        { n: "Physiologie", t: 3, l: 0, p: 6 },
        { n: "Écologie", t: 3, l: 0, p: 6 },
      ] },
    "uni-sociales": { niveau: "uni", nom: "Sciences humaines et sociales, ex. psychologie (15 crédits)",
      cours: [
        { n: "Introduction à la psychologie", t: 3, l: 0, p: 6 },
        { n: "Méthodes de recherche", t: 3, l: 0, p: 6 },
        { n: "Statistiques en sciences sociales", t: 3, l: 1, p: 5 },
        { n: "Psychologie du développement", t: 3, l: 0, p: 6 },
        { n: "Cours au choix", t: 3, l: 0, p: 6 },
      ] },
    "uni-sante": { niveau: "uni", nom: "Sciences infirmières (15 crédits)",
      cours: [
        { n: "Anatomie et physiologie", t: 3, l: 2, p: 4, labo: "Laboratoire d'anatomie" },
        { n: "Fondements de la discipline infirmière", t: 3, l: 0, p: 6 },
        { n: "Pharmacologie", t: 3, l: 0, p: 6 },
        { n: "Soins et évaluation clinique", t: 2, l: 3, p: 4, labo: "Laboratoire de simulation" },
        { n: "Stage clinique", t: 0, l: 8, p: 1, stage: true, labo: "Stage à l'hôpital" },
      ] },
    "uni-admin": { niveau: "uni", nom: "Administration des affaires, BAA (15 crédits)",
      cours: [
        { n: "Comptabilité financière", t: 3, l: 1, p: 5 },
        { n: "Marketing", t: 3, l: 0, p: 6 },
        { n: "Microéconomie", t: 3, l: 0, p: 6 },
        { n: "Mathématiques de gestion", t: 3, l: 1, p: 5 },
        { n: "Management et organisations", t: 3, l: 0, p: 6 },
      ] },
    "uni-info": { niveau: "uni", nom: "Informatique (15 crédits)",
      cours: [
        { n: "Programmation I", t: 3, l: 2, p: 4, labo: "Laboratoire de programmation" },
        { n: "Mathématiques discrètes", t: 3, l: 1, p: 5 },
        { n: "Structures de données", t: 3, l: 2, p: 4, labo: "Travaux pratiques" },
        { n: "Systèmes informatiques", t: 3, l: 0, p: 6 },
        { n: "Cours au choix", t: 3, l: 0, p: 6 },
      ] },
  },

  /* Repères : heures par semaine pour les repas, l'hygiène et les tâches. */
  routine: { famille: 18, autonome: 24 },
  depenses: { epicerieFamille: 15, epicerieAutonome: 85, telephone: 12, sortieParHeure: 12 },

  /* Événements possibles pendant la session. Chaque choix modifie les jauges :
   * energie, moral (0 à 100), argent ($), prep (préparation aux cours, en points),
   * travail (heures de travail payées en plus), temps (heures prises sur le temps libre).
   * « sage » indique le choix retenu par la simulation automatique. */
  evenements: [
    { id: "quart", t: "Ton patron te propose 8 heures de plus cette semaine.", si: (s) => s.travail > 0,
      choix: [{ t: "Accepter", e: { travail: 8, energie: -8, prep: -6 } }, { t: "Refuser poliment", e: { moral: -1 }, sage: true }] },
    { id: "grippe", t: "Grippe ! Tu es malade pendant trois jours.",
      choix: [{ t: "Rester au lit et rattraper ensuite", e: { energie: 5, prep: -10 }, sage: true }, { t: "Aller aux cours quand même", e: { energie: -15, prep: -4, moral: -4 } }] },
    { id: "equipe", t: "Travail d'équipe : un coéquipier ne fait rien.",
      choix: [{ t: "Tout faire toi-même", e: { energie: -8, temps: 4, prep: 3, moral: -3 } }, { t: "En parler à l'équipe et au prof", e: { moral: -2, prep: 1 }, sage: true }] },
    { id: "cell", t: "Ton cellulaire tombe et l'écran se brise.",
      choix: [{ t: "Le faire réparer (180 $)", e: { argent: -180, moral: -2 }, sage: true }, { t: "Vivre avec l'écran fissuré", e: { moral: -5 } }] },
    { id: "party", t: "Des amis t'invitent à un party jeudi soir.",
      choix: [{ t: "Y aller", e: { moral: 9, energie: -9, argent: -35, temps: 5 } }, { t: "Rester tranquille", e: { moral: -3 }, sage: true }] },
    { id: "atelier", t: "Le centre d'aide offre un atelier gratuit sur la méthode de travail.",
      choix: [{ t: "S'inscrire (2 h)", e: { temps: 2, bonus: 4, moral: 1 }, sage: true }, { t: "Pas le temps", e: {} }] },
    { id: "bourse", t: "Bonne nouvelle : la Fondation te remet une bourse de persévérance de 500 $ !", rare: true,
      choix: [{ t: "Merci !", e: { argent: 500, moral: 8 }, sage: true }] },
    { id: "club", t: "Une équipe sportive ou un club étudiant recrute.",
      choix: [{ t: "Rejoindre (2 h par semaine)", e: { moral: 6, sportFixe: 2 }, sage: true }, { t: "Peut-être plus tard", e: {} }] },
    { id: "quiz", t: "Quiz surprise en classe aujourd'hui.", quiz: true,
      choix: [{ t: "On verra bien…", e: {}, sage: true }] },
    { id: "visite", t: "C'est la fête d'un proche à la maison, en fin de semaine.", si: (s) => s.logement !== "famille",
      choix: [{ t: "Rentrer chez toi (≈ 70 $)", e: { argent: -70, moral: 10, temps: 8 }, sage: true }, { t: "Rester étudier", e: { moral: -6, prep: 2 } }] },
    { id: "stage", t: "Une entreprise cherche des stagiaires pour l'été : la date limite est vendredi.",
      choix: [{ t: "Préparer ton CV et postuler (3 h)", e: { temps: 3, stageEte: true }, sage: true }, { t: "Laisser passer", e: {} }] },
    { id: "loyer", t: "Ta colocataire part : il faut payer sa part du loyer ce mois-ci.", si: (s) => s.logement === "coloc",
      choix: [{ t: "Payer en attendant un remplaçant (300 $)", e: { argent: -300, moral: -4 }, sage: true }, { t: "Trouver vite quelqu'un (4 h de recherche)", e: { temps: 4, argent: -80, moral: -2 } }] },
    { id: "nuit", t: "Tu as passé la nuit sur ton téléphone.",
      choix: [{ t: "Couper les écrans à 23 h dès ce soir", e: { energie: -6, moral: -1 }, sage: true }, { t: "Bof, ça arrive", e: { energie: -12 } }] },
    { id: "prof", t: "Ton prof offre des heures de disponibilité avant l'examen.",
      choix: [{ t: "Y aller (1 h)", e: { temps: 1, prep: 5 }, sage: true }, { t: "Te débrouiller seul", e: {} }] },
  ],
};
