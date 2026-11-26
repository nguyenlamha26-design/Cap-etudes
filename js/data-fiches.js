/* Fiches détaillées des universités : campus, forces, vie étudiante, aides propres à chaque école,
 * et appréciations supplémentaires (1 à 5) utilisées par le classement.
 * Les effectifs sont des ordres de grandeur. Appréciations indicatives. */

CE.FICHES = {
  udem: {
    taille: "≈ 45 000 étudiants (plus HEC et Polytechnique sur le même campus)",
    campus: ["Montréal (Côte-des-Neiges)", "Laval", "Longueuil", "Saint-Hyacinthe (médecine vétérinaire)"],
    forces: ["Santé", "Droit", "Psychologie", "Sciences", "Arts et sciences"],
    vie: "Grand campus sur le flanc du mont Royal, centre sportif CEPSUM, associations très actives.",
    logement: "Résidences sur le campus ; nombreux logements dans Côte-des-Neiges.",
    aides: ["Bourses d'admission selon le dossier scolaire", "Bourses d'excellence et de mobilité internationale", "Aide financière d'urgence et conseil budgétaire"],
    s: { stages: 3, residences: 4, vie: 4, encadrement: 3, recherche: 5 },
  },
  mcgill: {
    taille: "≈ 40 000 étudiants",
    campus: ["Montréal (centre-ville)", "Sainte-Anne-de-Bellevue (campus Macdonald)"],
    forces: ["Médecine", "Sciences", "Génie", "Droit civil et common law", "Agriculture et environnement (Macdonald)"],
    vie: "Campus au centre-ville, très international ; on peut remettre ses travaux en français.",
    logement: "Résidences pour la majorité des nouveaux étudiants venant de loin.",
    aides: ["Bourses d'entrée d'un an ou renouvelables", "Aide financière selon les besoins", "Bourses de travail-études"],
    s: { stages: 3, residences: 4, vie: 5, encadrement: 2, recherche: 5 },
  },
  laval: {
    taille: "≈ 45 000 étudiants",
    campus: ["Québec (Sainte-Foy)", "Forêt Montmorency (enseignement et recherche)"],
    forces: ["Santé", "Foresterie et agroalimentaire", "Administration", "Sciences sociales", "Génie"],
    vie: "Campus vert et relié par des tunnels l'hiver, PEPS (sports), ville étudiante à taille humaine.",
    logement: "Grandes résidences sur le campus à prix abordables.",
    aides: ["Bourses d'admission", "Bourses de mobilité du profil international", "Bureau des bourses et de l'aide financière"],
    s: { stages: 4, residences: 5, vie: 5, encadrement: 3, recherche: 5 },
  },
  sherbrooke: {
    taille: "≈ 30 000 étudiants",
    campus: ["Sherbrooke (campus principal)", "Campus de la santé (Sherbrooke)", "Longueuil"],
    forces: ["Régime coopératif", "Génie", "Médecine", "Droit", "Administration"],
    vie: "Ville étudiante, plein air à proximité ; transport en commun gratuit pour les étudiants.",
    logement: "Résidences et loyers parmi les plus abordables des villes universitaires.",
    aides: ["Bourses d'accueil et d'excellence", "Stages coop rémunérés qui financent les études", "Aide financière et fonds d'urgence"],
    s: { stages: 5, residences: 4, vie: 5, encadrement: 4, recherche: 4 },
  },
  concordia: {
    taille: "≈ 45 000 étudiants",
    campus: ["Sir-George-Williams (centre-ville)", "Loyola (Notre-Dame-de-Grâce)"],
    forces: ["Beaux-arts et cinéma", "Génie et informatique", "Affaires (John Molson)", "Communication"],
    vie: "Ambiance urbaine et créative, nombreux programmes en régime coop.",
    logement: "Résidences limitées ; beaucoup d'étudiants en colocation.",
    aides: ["Bourses d'entrée", "Bourses selon les besoins", "Programme travail-études"],
    s: { stages: 4, residences: 3, vie: 4, encadrement: 3, recherche: 4 },
  },
  uqam: {
    taille: "≈ 35 000 étudiants",
    campus: ["Quartier latin (Montréal)", "Centres à Laval, Longueuil et Lanaudière"],
    forces: ["Communication et médias", "Arts et design", "Sciences sociales", "Gestion (ESG UQAM)", "Éducation"],
    vie: "Campus au cœur du centre-ville culturel, très engagé socialement.",
    logement: "Résidences au centre-ville ; colocation fréquente.",
    aides: ["Bourses d'accueil", "Fondation UQAM : bourses d'excellence et selon les besoins", "Aide d'urgence"],
    s: { stages: 3, residences: 3, vie: 4, encadrement: 3, recherche: 4 },
  },
  poly: {
    taille: "≈ 10 000 étudiants",
    campus: ["Campus de l'Université de Montréal"],
    forces: ["Génie (12 programmes)", "Recherche appliquée", "Clubs techniques (véhicules, robots, fusées)"],
    vie: "Sociétés techniques très actives, partage la vie du campus de l'UdeM.",
    logement: "Accès aux résidences du campus.",
    aides: ["Bourses d'excellence à l'admission", "Bourses d'entreprises partenaires", "Stages rémunérés en génie"],
    s: { stages: 4, residences: 3, vie: 4, encadrement: 3, recherche: 5 },
  },
  hec: {
    taille: "≈ 14 000 étudiants",
    campus: ["Côte-des-Neiges", "Centre-ville de Montréal"],
    forces: ["Gestion", "BAA trilingue", "Finance", "Marketing", "Entrepreneuriat"],
    vie: "Comités étudiants et compétitions de cas très actifs.",
    logement: "Accès aux résidences du campus de l'UdeM.",
    aides: ["Bourses d'admission", "Bourses de mobilité internationale", "Bourses d'entreprises"],
    s: { stages: 3, residences: 3, vie: 4, encadrement: 3, recherche: 4 },
  },
  ets: {
    taille: "≈ 11 000 étudiants",
    campus: ["Centre-ville de Montréal (Griffintown)"],
    forces: ["Génie appliqué", "Stages rémunérés obligatoires", "Accueil des diplômés des DEC techniques"],
    vie: "Clubs étudiants scientifiques réputés (compétitions internationales).",
    logement: "Résidences de l'ÉTS sur le campus.",
    aides: ["Bourses d'admission", "Trois stages rémunérés pendant le bac", "Bourses de l'industrie"],
    s: { stages: 5, residences: 4, vie: 4, encadrement: 3, recherche: 4 },
  },
  uqtr: {
    taille: "≈ 15 000 étudiants",
    campus: ["Trois-Rivières", "Drummondville", "Centres en région"],
    forces: ["Chiropratique", "Podiatrie", "Pratique sage-femme", "Sciences de l'activité physique", "Ergothérapie"],
    vie: "Campus à taille humaine, coût de la vie bas, à mi-chemin entre Montréal et Québec.",
    logement: "Résidences sur le campus, loyers abordables en ville.",
    aides: ["Bourses d'accueil", "Bourses d'excellence", "Aide aux étudiants venant de l'extérieur de la région"],
    s: { stages: 4, residences: 4, vie: 3, encadrement: 4, recherche: 3 },
  },
  uqac: {
    taille: "≈ 7 000 étudiants",
    campus: ["Saguenay (Chicoutimi)", "École NAD-UQAC à Montréal (animation 3D, jeux)", "Centres en région"],
    forces: ["Génie", "Sciences de la Terre", "Arts numériques", "Études autochtones", "Plein air"],
    vie: "Petites cohortes, nature et plein air à deux pas.",
    logement: "Résidences et loyers parmi les plus bas.",
    aides: ["Bourses d'accueil", "Bourses pour étudier en région", "Aide financière d'urgence"],
    s: { stages: 4, residences: 4, vie: 3, encadrement: 5, recherche: 3 },
  },
  uqar: {
    taille: "≈ 7 000 étudiants",
    campus: ["Rimouski", "Lévis"],
    forces: ["Océanographie et sciences de la mer", "Biologie", "Sciences infirmières", "Développement régional"],
    vie: "Au bord du fleuve à Rimouski, campus de Lévis près de Québec.",
    logement: "Résidences abordables sur les deux campus.",
    aides: ["Bourses d'accueil", "Bourses d'excellence", "Soutien aux étudiants venant de loin"],
    s: { stages: 4, residences: 4, vie: 3, encadrement: 5, recherche: 3 },
  },
  uqo: {
    taille: "≈ 8 000 étudiants",
    campus: ["Gatineau", "Saint-Jérôme"],
    forces: ["Administration", "Sciences infirmières", "Informatique", "Éducation", "Travail social"],
    vie: "Proximité d'Ottawa : stages et emplois dans la fonction publique fédérale.",
    logement: "Résidences limitées, logements en ville.",
    aides: ["Bourses d'accueil", "Bourses d'excellence", "Aide d'urgence"],
    s: { stages: 3, residences: 3, vie: 3, encadrement: 4, recherche: 2 },
  },
  uqat: {
    taille: "≈ 4 000 étudiants",
    campus: ["Rouyn-Noranda", "Val-d'Or", "Amos", "Montréal (création numérique)"],
    forces: ["Génie des mines", "Foresterie", "Études autochtones", "Création numérique", "Éducation"],
    vie: "Très petites classes, communauté soudée, plein air.",
    logement: "Résidences et logements abordables.",
    aides: ["Bourses d'accueil", "Soutien à la réussite en région", "Bourses pour étudiants autochtones"],
    s: { stages: 4, residences: 3, vie: 2, encadrement: 5, recherche: 2 },
  },
  bishops: {
    taille: "≈ 3 000 étudiants",
    campus: ["Sherbrooke (Lennoxville)"],
    forces: ["Arts libéraux", "Affaires (Williams School)", "Éducation", "Sciences"],
    vie: "Campus résidentiel : la plupart des étudiants de 1re année vivent sur place.",
    logement: "Résidences sur le campus.",
    aides: ["Bourses d'entrée", "Bourses selon les besoins", "Emplois sur le campus"],
    s: { stages: 2, residences: 5, vie: 5, encadrement: 5, recherche: 2 },
  },
  teluq: {
    taille: "≈ 20 000 étudiants à distance",
    campus: ["100 % en ligne"],
    forces: ["Études à ton rythme", "Formation en administration, informatique, éducation", "Conciliation travail-études"],
    vie: "Pas de campus ; étudie de chez toi.",
    logement: "Aucun déménagement nécessaire.",
    aides: ["Admissible à l'Aide financière aux études selon la charge de cours", "Peu de bourses d'admission"],
    s: { stages: 1, residences: 1, vie: 1, encadrement: 3, recherche: 2 },
  },
};

/* Coût de la vie relatif (5 = très abordable). */
CE.COUT_SCORE = { "Montréal": 2, "Québec": 3, "Sherbrooke": 4, "Trois-Rivières": 5, "Saguenay": 5, "Rimouski": 4, "Gatineau": 3, "Rouyn-Noranda": 4, "À distance": 5 };

/* Coordonnées approximatives (latitude, longitude) pour estimer les distances. */
CE.LIEUX = {
  "Montréal": [45.50, -73.57], "Laval": [45.61, -73.71], "Longueuil": [45.53, -73.52], "Terrebonne": [45.70, -73.65],
  "Sainte-Thérèse": [45.64, -73.84], "Saint-Jérôme": [45.78, -74.00], "Mont-Laurier": [46.55, -75.50],
  "Joliette": [46.02, -73.44], "Saint-Jean-sur-Richelieu": [45.31, -73.26], "Saint-Hyacinthe": [45.63, -72.96],
  "Granby": [45.40, -72.73], "Salaberry-de-Valleyfield": [45.25, -74.13], "Sorel-Tracy": [46.04, -73.11],
  "Sherbrooke": [45.40, -71.89], "Magog": [45.27, -72.15], "Drummondville": [45.88, -72.48], "Victoriaville": [46.05, -71.96],
  "Trois-Rivières": [46.35, -72.55], "Shawinigan": [46.57, -72.75],
  "Québec": [46.81, -71.21], "Lévis": [46.80, -71.18], "Saint-Georges": [46.12, -70.67], "Thetford Mines": [46.09, -71.30],
  "La Pocatière": [47.37, -70.03], "Rivière-du-Loup": [47.83, -69.54], "Rimouski": [48.45, -68.52], "Matane": [48.85, -67.53],
  "Gaspé": [48.83, -64.48], "Carleton-sur-Mer": [48.10, -66.13], "Îles-de-la-Madeleine": [47.38, -61.86],
  "Baie-Comeau": [49.22, -68.15], "Sept-Îles": [50.22, -66.38],
  "Saguenay": [48.43, -71.07], "Alma": [48.55, -71.65], "Saint-Félicien": [48.65, -72.45], "Chibougamau": [49.91, -74.37],
  "Gatineau": [45.48, -75.70], "Rouyn-Noranda": [48.24, -79.02], "Val-d'Or": [48.10, -77.78], "Amos": [48.57, -78.12],
};

/* Distance routière estimée (km) : distance à vol d'oiseau × 1,25. */
CE.distanceKm = function (a, b) {
  const p = CE.LIEUX[a], q = CE.LIEUX[b];
  if (!p || !q) return null;
  const r = Math.PI / 180;
  const d = 2 * 6371 * Math.asin(Math.sqrt(
    Math.sin((q[0] - p[0]) * r / 2) ** 2 + Math.cos(p[0] * r) * Math.cos(q[0] * r) * Math.sin((q[1] - p[1]) * r / 2) ** 2));
  return Math.round(d * 1.25);
};
