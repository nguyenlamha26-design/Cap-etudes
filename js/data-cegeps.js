/* Cégeps publics (et quelques collèges privés subventionnés cités dans l'offre). */
CE.CEGEPS = [
  // Montréal
  { id: "ahuntsic", nom: "Collège Ahuntsic", ville: "Montréal", region: "Montréal", langue: "fr" },
  { id: "andre-laurendeau", nom: "Cégep André-Laurendeau", ville: "Montréal", region: "Montréal", langue: "fr" },
  { id: "bois-de-boulogne", nom: "Collège de Bois-de-Boulogne", ville: "Montréal", region: "Montréal", langue: "fr" },
  { id: "dawson", nom: "Dawson College", ville: "Montréal", region: "Montréal", langue: "en" },
  { id: "gerald-godin", nom: "Cégep Gérald-Godin", ville: "Montréal", region: "Montréal", langue: "fr" },
  { id: "john-abbott", nom: "John Abbott College", ville: "Sainte-Anne-de-Bellevue", region: "Montréal", langue: "en" },
  { id: "maisonneuve", nom: "Collège de Maisonneuve", ville: "Montréal", region: "Montréal", langue: "fr" },
  { id: "marie-victorin", nom: "Cégep Marie-Victorin", ville: "Montréal", region: "Montréal", langue: "fr" },
  { id: "rosemont", nom: "Collège de Rosemont", ville: "Montréal", region: "Montréal", langue: "fr" },
  { id: "saint-laurent", nom: "Cégep de Saint-Laurent", ville: "Montréal", region: "Montréal", langue: "fr" },
  { id: "vanier", nom: "Vanier College", ville: "Montréal", region: "Montréal", langue: "en" },
  { id: "vieux-montreal", nom: "Cégep du Vieux Montréal", ville: "Montréal", region: "Montréal", langue: "fr" },
  { id: "vincent-dindy", nom: "École de musique Vincent-d'Indy (privé)", ville: "Montréal", region: "Montréal", langue: "fr" },
  // Laval, Laurentides, Lanaudière
  { id: "montmorency", nom: "Collège Montmorency", ville: "Laval", region: "Laval", langue: "fr" },
  { id: "lionel-groulx", nom: "Collège Lionel-Groulx", ville: "Sainte-Thérèse", region: "Laurentides", langue: "fr" },
  { id: "saint-jerome", nom: "Cégep de Saint-Jérôme", ville: "Saint-Jérôme", region: "Laurentides", langue: "fr" },
  { id: "lanaudiere", nom: "Cégep régional de Lanaudière", ville: "Joliette, L'Assomption, Terrebonne", region: "Lanaudière", langue: "fr" },
  // Montérégie
  { id: "edouard-montpetit", nom: "Cégep Édouard-Montpetit", ville: "Longueuil", region: "Montérégie", langue: "fr" },
  { id: "champlain", nom: "Champlain Regional College", ville: "Saint-Lambert, Lennoxville, Québec", region: "Montérégie", langue: "en" },
  { id: "granby", nom: "Cégep de Granby", ville: "Granby", region: "Montérégie", langue: "fr" },
  { id: "saint-hyacinthe", nom: "Cégep de Saint-Hyacinthe", ville: "Saint-Hyacinthe", region: "Montérégie", langue: "fr" },
  { id: "saint-jean", nom: "Cégep Saint-Jean-sur-Richelieu", ville: "Saint-Jean-sur-Richelieu", region: "Montérégie", langue: "fr" },
  { id: "sorel-tracy", nom: "Cégep de Sorel-Tracy", ville: "Sorel-Tracy", region: "Montérégie", langue: "fr" },
  { id: "valleyfield", nom: "Collège de Valleyfield", ville: "Salaberry-de-Valleyfield", region: "Montérégie", langue: "fr" },
  // Capitale-Nationale, Chaudière-Appalaches
  { id: "garneau", nom: "Cégep Garneau", ville: "Québec", region: "Capitale-Nationale", langue: "fr" },
  { id: "limoilou", nom: "Cégep Limoilou", ville: "Québec", region: "Capitale-Nationale", langue: "fr" },
  { id: "sainte-foy", nom: "Cégep de Sainte-Foy", ville: "Québec", region: "Capitale-Nationale", langue: "fr" },
  { id: "levis", nom: "Cégep de Lévis", ville: "Lévis", region: "Chaudière-Appalaches", langue: "fr" },
  { id: "beauce", nom: "Cégep Beauce-Appalaches", ville: "Saint-Georges", region: "Chaudière-Appalaches", langue: "fr" },
  { id: "thetford", nom: "Cégep de Thetford", ville: "Thetford Mines", region: "Chaudière-Appalaches", langue: "fr" },
  // Mauricie, Centre-du-Québec, Estrie
  { id: "trois-rivieres", nom: "Cégep de Trois-Rivières", ville: "Trois-Rivières", region: "Mauricie", langue: "fr" },
  { id: "shawinigan", nom: "Cégep de Shawinigan", ville: "Shawinigan", region: "Mauricie", langue: "fr" },
  { id: "drummondville", nom: "Cégep de Drummondville", ville: "Drummondville", region: "Centre-du-Québec", langue: "fr" },
  { id: "victoriaville", nom: "Cégep de Victoriaville", ville: "Victoriaville", region: "Centre-du-Québec", langue: "fr" },
  { id: "sherbrooke", nom: "Cégep de Sherbrooke", ville: "Sherbrooke", region: "Estrie", langue: "fr" },
  // Outaouais, Abitibi
  { id: "outaouais", nom: "Cégep de l'Outaouais", ville: "Gatineau", region: "Outaouais", langue: "fr" },
  { id: "heritage", nom: "Heritage College", ville: "Gatineau", region: "Outaouais", langue: "en" },
  { id: "abitibi", nom: "Cégep de l'Abitibi-Témiscamingue", ville: "Rouyn-Noranda, Amos, Val-d'Or", region: "Abitibi-Témiscamingue", langue: "fr" },
  // Saguenay–Lac-Saint-Jean
  { id: "chicoutimi", nom: "Cégep de Chicoutimi", ville: "Saguenay", region: "Saguenay–Lac-Saint-Jean", langue: "fr" },
  { id: "jonquiere", nom: "Cégep de Jonquière", ville: "Saguenay", region: "Saguenay–Lac-Saint-Jean", langue: "fr" },
  { id: "alma", nom: "Collège d'Alma", ville: "Alma", region: "Saguenay–Lac-Saint-Jean", langue: "fr" },
  { id: "saint-felicien", nom: "Cégep de Saint-Félicien", ville: "Saint-Félicien", region: "Saguenay–Lac-Saint-Jean", langue: "fr" },
  // Bas-Saint-Laurent, Gaspésie, Côte-Nord
  { id: "rimouski", nom: "Cégep de Rimouski", ville: "Rimouski", region: "Bas-Saint-Laurent", langue: "fr" },
  { id: "riviere-du-loup", nom: "Cégep de Rivière-du-Loup", ville: "Rivière-du-Loup", region: "Bas-Saint-Laurent", langue: "fr" },
  { id: "matane", nom: "Cégep de Matane", ville: "Matane", region: "Bas-Saint-Laurent", langue: "fr" },
  { id: "la-pocatiere", nom: "Cégep de La Pocatière", ville: "La Pocatière", region: "Bas-Saint-Laurent", langue: "fr" },
  { id: "gaspesie", nom: "Cégep de la Gaspésie et des Îles", ville: "Gaspé, Carleton, Îles-de-la-Madeleine", region: "Gaspésie–Îles-de-la-Madeleine", langue: "fr" },
  { id: "baie-comeau", nom: "Cégep de Baie-Comeau", ville: "Baie-Comeau", region: "Côte-Nord", langue: "fr" },
  { id: "sept-iles", nom: "Cégep de Sept-Îles", ville: "Sept-Îles", region: "Côte-Nord", langue: "fr" },
];

/* Cégeps privés qui n'offrent pas les programmes « partout » (préuniversitaires de base). */
CE.CEGEPS_SPECIALISES = ["vincent-dindy"];
