/* Valeurs par défaut du budget étudiant (estimations 2026, à ajuster : chaque montant est modifiable).
 * Loyers mensuels : résidence étudiante, chambre en colocation, petit appartement seul. */
CE.LOYERS = {
  "Montréal":       { residence: 650, coloc: 800, seul: 1400, transport: 58 },
  "Québec":         { residence: 550, coloc: 650, seul: 1100, transport: 60 },
  "Gatineau":       { residence: 575, coloc: 750, seul: 1250, transport: 65 },
  "Sherbrooke":     { residence: 500, coloc: 600, seul: 950,  transport: 0, noteTransport: "Autobus inclus pour les étudiants de l'UdeS et du Cégep de Sherbrooke." },
  "Trois-Rivières": { residence: 450, coloc: 550, seul: 850,  transport: 45 },
  "Saguenay":       { residence: 450, coloc: 525, seul: 800,  transport: 45 },
  "Rimouski":       { residence: 450, coloc: 550, seul: 850,  transport: 40 },
  "Rouyn-Noranda":  { residence: 450, coloc: 600, seul: 950,  transport: 40 },
  "Laval":          { residence: 600, coloc: 750, seul: 1300, transport: 58 },
  "Longueuil":      { residence: 600, coloc: 750, seul: 1250, transport: 58 },
  _region:          { residence: 450, coloc: 550, seul: 850,  transport: 35 },
};

CE.LOGEMENT_TYPES = {
  famille: "Chez mes parents ou de la famille",
  residence: "Résidence étudiante",
  coloc: "Chambre en colocation",
  seul: "Appartement seul",
};

/* Coût d'un aller-retour par km selon le moyen de transport. */
CE.TRANSPORT_RETOUR = {
  auto: { nom: "Ma voiture (essence et usure)", parKm: 0.22 },
  covoit: { nom: "Covoiturage", parKm: 0.10 },
  autocar: { nom: "Autocar ou train", parKm: 0.14, minimum: 25 },
};

/* Frais annuels typiques (résident du Québec). */
CE.FRAIS = {
  uni:   { scolarite: 4200, materiel: 800, note: "Droits de scolarité et frais afférents pour 30 crédits (résident du Québec), estimation." },
  cegep: { scolarite: 400,  materiel: 500, note: "Le cégep public est gratuit ; restent les frais d'inscription, afférents et de matériel." },
};

CE.SALAIRE_MIN = 16.60;
