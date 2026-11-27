/* Vie étudiante : horaire type d'une semaine et simulation complète d'une session (15 semaines). */
(function () {
  const { esc, store, page, fmt, num } = UI;
  const V = CE.VIE;
  const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const H0 = 7, H1 = 23;                      // heures affichées dans la grille
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const alea = (a, b) => a + Math.random() * (b - a);

  const DEFAUT = { niveau: "cegep", profil: "cegep-sciences", logement: "famille", ville: "Montréal", etude: null,
    travail: 10, trajet: 40, sommeil: 8, sorties: 6, sport: 2, economies: 1500, parents: 0 };

  /* ---------- Calculs communs ---------- */
  function profil(p) { return V.profils[p.profil]; }
  function heuresCours(pr) { return pr.cours.reduce((s, c) => s + c.t + c.l, 0); }
  function heuresPerso(pr) { return pr.cours.reduce((s, c) => s + c.p, 0); }
  function routine(p) { return p.logement === "famille" ? V.routine.famille : V.routine.autonome; }
  function trajetH(p) { return Math.round((p.trajet * 2 * 5) / 60 * 10) / 10; }
  function etude(p) { return p.etude == null ? heuresPerso(profil(p)) : p.etude; }

  function bilan(p) {
    const pr = profil(p);
    const parts = [
      { k: "cours", t: "Cours et labos", h: heuresCours(pr) },
      { k: "etude", t: "Étude et travaux", h: etude(p) },
      { k: "travail", t: "Emploi", h: p.travail },
      { k: "trajet", t: "Transport", h: trajetH(p) },
      { k: "sommeil", t: "Sommeil", h: p.sommeil * 7 },
      { k: "routine", t: "Repas, tâches, hygiène", h: routine(p) },
      { k: "sport", t: "Sport", h: p.sport },
      { k: "sorties", t: "Amis et sorties", h: p.sorties },
    ];
    const total = parts.reduce((s, x) => s + x.h, 0);
    return { parts, libre: Math.round((168 - total) * 10) / 10, charge: heuresCours(pr) + etude(p) + p.travail };
  }

  /* Dépenses d'une semaine selon le logement et la ville (données du module Budget). */
  function depensesSemaine(p, sorties) {
    const L = CE.LOYERS[p.ville] || CE.LOYERS._region;
    const D = V.depenses;
    const loyer = p.logement === "famille" ? 0 : (L[p.logement] || L.coloc) * 12 / 52;
    const epicerie = p.logement === "famille" ? D.epicerieFamille : D.epicerieAutonome;
    return loyer + epicerie + (L.transport || 0) * 12 / 52 + D.telephone + sorties * D.sortieParHeure;
  }

  /* ---------- Horaire type ---------- */
  function construireHoraire(p) {
    const pr = profil(p);
    const libre = Array.from({ length: 7 }, () => Array(24).fill(true));
    const blocs = [];
    const poser = (j, h, n, type, titre) => {
      for (let k = h; k < h + n; k++) libre[j][k] = false;
      blocs.push({ j, h, n, type, titre });
    };
    const peut = (j, h, n, diner = true) => {
      if (h < H0 || h + n > H1) return false;
      for (let k = h; k < h + n; k++) if (!libre[j][k] || (diner && k === 12 && n < 6)) return false;
      return true;
    };
    // 1) Cours et laboratoires, répartis du lundi au vendredi (stages d'abord : une journée complète).
    const segments = [];
    pr.cours.forEach((c) => {
      if (c.stage) { segments.push({ n: c.l, type: "stage", titre: c.labo || c.n, c }); return; }
      const parts = p.niveau === "uni" || c.t < 3 ? [c.t] : [2, c.t - 2];
      parts.filter(Boolean).forEach((n) => segments.push({ n, type: "cours", titre: c.n, c }));
      if (c.l) segments.push({ n: c.l, type: "labo", titre: c.labo || `${c.n} (pratique)`, c });
    });
    segments.sort((a, b) => b.n - a.n);
    let jour = 0;
    const jourDe = new Map();
    segments.forEach((s) => {
      for (let essai = 0; essai < 5; essai++) {
        const j = (jour + essai) % 5;
        if ((jourDe.get(s.c) || []).includes(j)) continue;
        const debut = s.type === "stage" ? [8] : [8, 9, 10, 13, 14, 15, 11, 16];
        const h = debut.find((x) => peut(j, x, s.n, s.type !== "stage"));
        if (h != null) {
          poser(j, h, s.n, s.type, s.titre);
          jourDe.set(s.c, [...(jourDe.get(s.c) || []), j]);
          jour = (j + 1) % 5;
          return;
        }
      }
    });
    // 2) Emploi : la fin de semaine d'abord, puis le jeudi et le vendredi soir.
    let w = p.travail;
    [[5, 9, 8], [6, 10, 6], [4, 17, 4], [3, 17, 4], [6, 16, 4]].forEach(([j, h, max]) => {
      if (w <= 0) return;
      const n = Math.min(w, max);
      if (peut(j, h, n, false)) { poser(j, h, n, "travail", "Emploi"); w -= n; }
    });
    // 3) Sport et sorties.
    let sp = p.sport;
    [[1, 17], [3, 17], [5, 18], [0, 17], [2, 17], [6, 9]].forEach(([j, h]) => {
      if (sp <= 0) return;
      const n = Math.min(sp, 2);
      if (peut(j, h, n, false)) { poser(j, h, n, "sport", "Sport"); sp -= n; }
    });
    let so = p.sorties;
    [[4, 19], [5, 19], [2, 19], [6, 13]].forEach(([j, h]) => {
      if (so <= 0) return;
      const n = Math.min(so, 4);
      const h2 = [h, h + 1, h + 2].find((x) => peut(j, x, n, false));
      if (h2 != null) { poser(j, h2, n, "sorties", "Amis et sorties"); so -= n; }
    });
    // 4) Étude : les trous de la journée, puis les soirs de semaine, puis la fin de semaine.
    let e = etude(p);
    const creneaux = [];
    for (let j = 0; j < 5; j++) for (let h = 8; h < 17; h++) if (h !== 12) creneaux.push([j, h]);
    for (let j = 0; j < 4; j++) for (let h = 19; h < 22; h++) creneaux.push([j, h]);
    for (const j of [6, 5]) for (let h = 13; h < 18; h++) creneaux.push([j, h]);
    creneaux.forEach(([j, h]) => {
      if (e <= 0 || !peut(j, h, 1, false)) return;
      const n = Math.min(e, peut(j, h, 2, false) && h + 2 <= 22 && !(h < 12 && h + 2 > 12) ? 2 : 1);
      poser(j, h, n, "etude", "Étude et travaux"); e -= n;
    });
    // Fusion visuelle des blocs d'étude ou d'emploi qui se suivent.
    blocs.sort((a, b) => a.j - b.j || a.h - b.h);
    const fusion = [];
    blocs.forEach((b) => {
      const d = fusion[fusion.length - 1];
      if (d && d.j === b.j && d.type === b.type && d.titre === b.titre && d.h + d.n === b.h && (b.type === "etude" || b.type === "travail")) d.n += b.n;
      else fusion.push(Object.assign({}, b));
    });
    return { blocs: fusion, etudeManquante: Math.max(0, e), travailManquant: Math.max(0, w) };
  }

  const TYPES = {
    cours: "Cours", labo: "Labo ou atelier", stage: "Stage", etude: "Étude", travail: "Emploi", sport: "Sport", sorties: "Amis et sorties",
  };

  function horaireHtml(p) {
    const pr = profil(p);
    const { blocs, etudeManquante, travailManquant } = construireHoraire(p);
    const lignes = H1 - H0;
    return `
      <div class="horaire-wrap"><div class="horaire" style="grid-template-rows: auto repeat(${lignes}, var(--h-ligne))">
        <span class="h-coin"></span>${JOURS.map((j, i) => `<span class="h-jour" style="grid-column:${i + 2}">${j}</span>`).join("")}
        ${Array.from({ length: lignes }, (_, i) => `<span class="h-heure" style="grid-row:${i + 2}">${H0 + i} h</span>`).join("")}
        ${Array.from({ length: 7 * lignes }, (_, i) => `<span class="h-case" style="grid-column:${(i % 7) + 2};grid-row:${Math.floor(i / 7) + 2}"></span>`).join("")}
        ${blocs.map((b) => `<div class="h-bloc t-${b.type}" style="grid-column:${b.j + 2};grid-row:${b.h - H0 + 2} / span ${b.n}" title="${esc(b.titre)} · ${b.h} h à ${b.h + b.n} h">
          <b>${esc(b.titre)}</b><span>${b.h} h – ${b.h + b.n} h</span></div>`).join("")}
      </div></div>
      <div class="legende">${Object.entries(TYPES).map(([k, t]) => `<span><i class="t-${k}"></i>${t}</span>`).join("")}</div>
      ${etudeManquante || travailManquant ? `<p class="badge warn">${etudeManquante ? `${etudeManquante} h d'étude` : ""}${etudeManquante && travailManquant ? " et " : ""}${travailManquant ? `${travailManquant} h d'emploi` : ""} n'entrent pas dans la semaine : ton horaire est trop chargé.</p>` : ""}
      <p class="muted small">Exemple d'horaire de 1re session. Ton vrai horaire dépend de ton établissement et de tes groupes ; il est souvent connu une ou deux semaines avant la rentrée. Le transport (${fmt(trajetH(p), 1)} h par semaine) n'est pas dessiné.</p>
      <details class="panel"><summary><b>Les cours de cette session</b> <span class="muted small">${p.niveau === "cegep" ? "pondération théorie-pratique-travail personnel" : "heures par semaine : cours, labo ou TP, travail personnel"}</span></summary>
        <table class="tbl"><thead><tr><th>Cours</th><th>En classe</th><th>Labo, atelier ou stage</th><th>Travail perso</th></tr></thead><tbody>
        ${pr.cours.map((c) => `<tr><td>${esc(c.n)}${c.fg ? ' <span class="tag">formation générale</span>' : ""}</td><td>${c.t} h</td><td>${c.l} h</td><td>${c.p} h</td></tr>`).join("")}
        <tr><td><b>Total</b></td><td colspan="2"><b>${heuresCours(pr)} h</b> par semaine à l'horaire</td><td><b>${heuresPerso(pr)} h</b></td></tr></tbody></table>
        <p class="small muted">${p.niveau === "cegep" ? "Au cégep, chaque cours a une pondération (ex. 3-2-3) : heures de théorie, de pratique et de travail personnel par semaine." : "À l'université, 1 crédit représente 45 heures de travail pendant la session : 15 crédits, c'est environ 45 heures par semaine, cours compris."}</p>
      </details>`;
  }

  /* ---------- Simulation d'une session ---------- */
  const SPECIAUX = {
    rentree: { t: "Première semaine : accueil, initiations et activités de la rentrée.",
      choix: [{ t: "Participer à tout", e: { moral: 10, energie: -5, argent: -40, temps: 6 }, sage: true }, { t: "Passer ton tour et t'installer", e: { moral: -3, prep: 2 } }] },
    relache: { t: "Semaine de relâche : pas de cours cette semaine !",
      choix: [{ t: "Repos et rattrapage", e: { energie: 20, prep: 8, moral: 4 }, sage: true }, { t: "Travailler à temps plein (30 h)", e: { travail: 30, energie: -4, moral: -2 } }, { t: "Partir quelques jours avec des amis (350 $)", e: { argent: -350, moral: 18, energie: 8 } }] },
  };

  function nouvelleSim(p) {
    return { profil: p.profil, semaine: 0, energie: 75, moral: 70, argent: num(p.economies) || 0, prepSum: 0, prepN: 0, bonus: 0, sportFixe: 0,
      notes: {}, quiz: [], hist: [], journal: [], evt: null, choix: null, stageEte: false, fini: false, vus: [] };
  }

  function tirerEvenement(s, p) {
    const w = s.semaine + 1;
    if (w === 1) return "rentree";
    if (w === V.relache) return "relache";
    if (Math.random() > 0.7) return null;
    const pool = V.evenements.filter((e) => !s.vus.includes(e.id) && (!e.si || e.si(p)) && (!e.rare || Math.random() < 0.35));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
  }
  const evtDef = (id) => SPECIAUX[id] || V.evenements.find((e) => e.id === id);
  const noteDe = (prep, energie) => clamp(Math.round(48 + 0.42 * prep + alea(-5, 5) - (energie < 25 ? 6 : 0)), 0, 100);

  function vivreSemaine(s, p) {
    const pr = profil(p), w = s.semaine + 1, relache = w === V.relache;
    const ev = s.evt ? evtDef(s.evt) : null;
    const idx = ev ? (s.choix ?? Math.max(0, ev.choix.findIndex((c) => c.sage))) : null;
    const e = ev ? ev.choix[idx].e : {};
    const cours = relache ? 0 : heuresCours(pr), besoin = relache ? 0 : heuresPerso(pr);
    const etu = relache ? Math.min(etude(p), 6) : etude(p);
    const travail = p.travail + (e.travail || 0);
    const sport = p.sport + s.sportFixe;
    const total = cours + etu + travail + (relache ? 0 : trajetH(p)) + routine(p) + p.sommeil * 7 + sport + p.sorties + (e.temps || 0);
    const sommeil = p.sommeil - Math.max(0, total - 168) / 7;
    const charge = cours + etu + travail;
    if (e.sportFixe) s.sportFixe += e.sportFixe;
    if (e.bonus) s.bonus += e.bonus;
    if (e.stageEte) s.stageEte = true;

    s.energie += (sommeil - 7) * 5 + sport * 1.2 - Math.max(0, travail - 12) - Math.max(0, charge - 50) * 0.6 + (e.energie || 0);
    s.energie = clamp(s.energie + (70 - s.energie) * 0.15, 0, 100);

    let prep = null;
    if (!relache) {
      const r = besoin ? etu / besoin : 1;
      prep = clamp(Math.min(r, 1.25) * (0.55 + 0.45 * s.energie / 100) * 100 + (e.prep || 0) + s.bonus - (s.moral < 25 ? 8 : 0), 0, 110);
      s.prepSum += prep; s.prepN++;
    } else if (e.prep) { s.prepSum += e.prep * s.prepN / 10; }

    s.moral += (p.sorties - 4) * 1.6 + sport * 0.8 - Math.max(0, charge - 50) * 0.7 - (s.argent < 0 ? 8 : 0) - (s.energie < 30 ? 5 : 0) + (e.moral || 0);
    s.moral = clamp(s.moral + (65 - s.moral) * 0.12, 0, 100);

    const frais = w === 1 ? (CE.FRAIS[p.niveau].scolarite + CE.FRAIS[p.niveau].materiel) / 2 : 0;
    const revenu = travail * CE.SALAIRE_MIN * 0.87 + (num(p.parents) || 0) * 12 / 52;
    s.argent = Math.round(s.argent + revenu - depensesSemaine(p, p.sorties) - frais + (e.argent || 0));

    const lignes = [];
    if (ev) lignes.push(`${ev.t} → <b>${esc(ev.choix[idx].t)}</b>`);
    if (frais) lignes.push(`Frais de session et matériel payés : ${fmt(frais, 0)} $.`);
    const moy = s.prepN ? s.prepSum / s.prepN : 0;
    if (ev && ev.quiz) { const q = noteDe(prep ?? moy, s.energie); s.quiz.push(q); lignes.push(`Résultat du quiz : <b>${q} %</b>.`); }
    if (w === V.examens[0]) { s.notes.mi = noteDe(moy, s.energie); lignes.push(`📝 Examens de mi-session : moyenne de <b>${s.notes.mi} %</b>.`); }
    if (w === V.examens[1]) { s.notes.fin = noteDe(moy, s.energie); lignes.push(`📝 Examens finaux : moyenne de <b>${s.notes.fin} %</b>.`); }
    if (sommeil < p.sommeil - 0.2) lignes.push(`Semaine trop chargée : tu as dormi environ ${fmt(sommeil, 1)} h par nuit.`);
    if (relache) lignes.push("Relâche : aucun cours.");
    if (!lignes.length) lignes.push("Semaine normale : cours, travaux et routine.");
    s.journal.unshift({ w, lignes, evt: ev ? s.evt : null, choix: idx });
    s.hist.push({ w, energie: Math.round(s.energie), moral: Math.round(s.moral), prep: prep == null ? null : Math.round(prep), argent: s.argent });
    if (ev) s.vus.push(s.evt);
    s.semaine = w; s.evt = null; s.choix = null;
    if (w >= V.semaines) s.fini = true;
    else s.evt = tirerEvenement(s, p);
  }

  /* Résultat scolaire : cote R estimée au cégep, lettre et moyenne cumulative à l'université. */
  function resultat(moy, niveau) {
    if (niveau === "cegep") {
      const cote = clamp(25 + 5 * (moy - 75) / 10, 15, 40);
      return { t: `Cote R estimée : ${fmt(cote, 1)}`, d: "Estimation pour un groupe de moyenne 75 % et d'écart type 10 : ta vraie cote dépend de la force de tes groupes." };
    }
    const T = [[90, "A+", 4.3], [85, "A", 4.0], [80, "A-", 3.7], [77, "B+", 3.3], [73, "B", 3.0], [70, "B-", 2.7], [65, "C+", 2.3], [60, "C", 2.0], [57, "C-", 1.7], [54, "D+", 1.3], [50, "D", 1.0], [0, "E", 0]];
    const [, l, g] = T.find(([s]) => moy >= s);
    return { t: `Moyenne : ${l} (${fmt(g, 1)} sur 4,3)`, d: "Barème courant au Québec ; chaque université a le sien." };
  }

  function courbe(hist, cle, couleur, min = 0, max = 100) {
    const pts = hist.filter((h) => h[cle] != null);
    if (pts.length < 2) return "";
    const x = (w) => 10 + (w - 1) * (280 / (V.semaines - 1)), y = (v) => 90 - (clamp(v, min, max) - min) / (max - min) * 80;
    return `<polyline fill="none" stroke="${couleur}" stroke-width="2.5" stroke-linejoin="round" points="${pts.map((h) => `${x(h.w)},${y(h[cle])}`).join(" ")}"/>`;
  }

  function rapport(s, p) {
    const moy = Math.round(0.4 * (s.notes.mi ?? 0) + 0.6 * (s.notes.fin ?? 0));
    const r = resultat(moy, p.niveau);
    const moyE = s.hist.reduce((a, h) => a + h.energie, 0) / s.hist.length;
    const moyM = s.hist.reduce((a, h) => a + h.moral, 0) / s.hist.length;
    const conseils = [];
    if (moy < 70) conseils.push("Tes notes sont fragiles : augmente tes heures d'étude ou va au centre d'aide et aux disponibilités des profs.");
    if (etude(p) < heuresPerso(profil(p)) * 0.8) conseils.push(`Tu étudies ${etude(p)} h par semaine alors que tes cours en demandent environ ${heuresPerso(profil(p))}.`);
    if (p.travail > 15) conseils.push("Plus de 15 h d'emploi par semaine pendant les cours nuit souvent aux résultats : vise plutôt l'été et les fins de semaine.");
    if (moyE < 45) conseils.push("Ton énergie a été basse : vise 8 h de sommeil et garde un peu de sport.");
    if (moyM < 45) conseils.push("Ton moral a souffert : garde du temps pour tes amis et des activités qui te font du bien. Les services aux étudiants offrent de l'aide psychologique gratuite.");
    if (s.argent < 0) conseils.push("Tu as fini la session dans le rouge : fais ta demande d'aide financière aux études et revois ton budget.");
    if (!conseils.length) conseils.push("Bel équilibre ! Tu as trouvé un rythme qui fonctionne : garde-le pour la prochaine session.");
    return `
      <div class="panel rapport">
        <h2 class="h3">Bilan de ta session</h2>
        <div class="grid4">
          <div class="stat"><span class="muted small">Moyenne de la session</span><strong>${moy} %</strong><span class="small">Mi-session ${s.notes.mi} % · finale ${s.notes.fin} %</span></div>
          <div class="stat"><span class="muted small">${p.niveau === "cegep" ? "Cote R" : "Résultat"}</span><strong class="petit">${esc(r.t.split(" : ")[1])}</strong><span class="small muted">${esc(r.d)}</span></div>
          <div class="stat ${s.argent >= 0 ? "solde pos" : "solde neg"}"><span class="muted small">Argent à la fin</span><strong>${fmt(s.argent, 0)} $</strong><span class="small">Départ : ${fmt(num(p.economies) || 0, 0)} $</span></div>
          <div class="stat"><span class="muted small">Énergie et moral moyens</span><strong>${Math.round(moyE)} · ${Math.round(moyM)}</strong><span class="small">sur 100</span></div>
        </div>
        ${s.stageEte ? '<p class="badge ok">Tu as postulé pour un stage d\'été : bonne longueur d\'avance !</p>' : ""}
        <h3 class="h4">Conseils</h3><ul>${conseils.map((c) => `<li>${c}</li>`).join("")}</ul>
        <a class="small" href="#/budget">Revoir mon budget →</a> · <a class="small" href="#/recherche?type=aide">Bourses et aides →</a>
      </div>`;
  }

  /* ---------- Mise en scène style jeu ---------- */
  const AVATARS = ["🧑‍🎓", "👩‍🎓", "👨‍🎓", "🧑🏽‍🎓", "👩🏿‍🎓", "👨🏻‍🎓"];
  const LIEUX = [
    { k: "maison", x: 9, ico: "🏠", nom: "Maison" }, { k: "campus", x: 31, nom: "Campus" },
    { k: "sorties", x: 53, ico: "☕", nom: "Café" }, { k: "sport", x: 72, ico: "🏟️", nom: "Gym" },
    { k: "travail", x: 91, ico: "🏪", nom: "Travail" },
  ];
  const LIEU_X = Object.fromEntries(LIEUX.map((l) => [l.k, l.x]));
  const ARBRES = [19.5, 42, 62.5, 81.5], LAMPES = [24, 47, 67, 86];
  const ACT_ICO = { cours: "📖", labo: "🧪", stage: "🩺", etude: "✏️", travail: "💼", sport: "⚽", sorties: "🎉", sommeil: "💤" };
  const PARTICULES = { cours: ["💡", "❓", "📐"], labo: ["🧪", "⚗️", "💡"], stage: ["🩺", "📋", "💉"], etude: ["✏️", "✨", "📚"],
    travail: ["🪙", "💵", "🪙"], sport: ["💦", "💪", "⚡"], sorties: ["🎵", "🎶", "😂"] };
  const EVT_ICO = { quart: "💼", grippe: "🤒", equipe: "👥", cell: "📱", party: "🎉", atelier: "🧠", bourse: "💰", club: "🏀", quiz: "❓",
    visite: "🏡", stage: "📄", loyer: "🏠", nuit: "🌙", prof: "👩‍🏫", rentree: "🎒", relache: "🏖️" };
  const JOURS_COURTS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];
  const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const METEO_ICO = { neige: "🌨️", pluie: "🌧️", feuilles: "🍂", clair: "🌤️" };
  const animOn = () => store.get("vie:anim", true);
  const humeurDe = (e, m) => (e < 30 ? "🥱" : m >= 75 ? "😄" : m >= 55 ? "🙂" : m >= 35 ? "😐" : m >= 20 ? "😟" : "😫");
  const humeur = (s) => humeurDe(s.energie, s.moral);
  const lieuDe = (b) => (["cours", "labo", "stage"].includes(b.type) ? "campus" : b.type === "etude" ? (b.j < 5 && b.h < 17 ? "campus" : "maison") : b.type);
  const moyenneSession = (s) => Math.round(0.4 * (s.notes.mi ?? 0) + 0.6 * (s.notes.fin ?? 0));
  const hasard = (t) => t[Math.floor(Math.random() * t.length)];

  /* Calendrier : le cégep commence vers la fin d'août, l'université après la fête du Travail. */
  function dateDe(p, w, j) {
    const d = new Date(new Date().getFullYear(), 8, 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    if (p.niveau === "cegep") d.setDate(d.getDate() - 14);
    d.setDate(d.getDate() + (w - 1) * 7 + j);
    return d;
  }
  function saison(d) {
    const m = d.getMonth();
    if (m === 11 || (m === 10 && d.getDate() >= 18)) return "hiver";
    return m === 10 ? "novembre" : m === 9 ? "automne" : "ete";
  }
  function meteo(w, sa) {
    const r = (Math.sin(w * 99.7) + 1) / 2;
    if (sa === "hiver") return r < 0.6 ? "neige" : "clair";
    if (r < 0.28) return "pluie";
    return sa === "automne" && r < 0.75 ? "feuilles" : "clair";
  }

  /* Ciel : dégradé calculé heure par heure. */
  const CIEL = [[0, "#0b1030", "#1b2350"], [5.5, "#141a40", "#2b3266"], [7, "#f59a6c", "#fcd9a8"], [9, "#5fb4ea", "#c4e8fb"], [16, "#4fa8e6", "#b8e2fa"],
    [18, "#f39a5b", "#fbd08a"], [19.5, "#a94b78", "#f08a6b"], [21, "#262b63", "#4a3f78"], [23, "#0b1030", "#1b2350"], [24, "#0b1030", "#1b2350"]];
  function melange(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    return `rgb(${[16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k)).join(",")})`;
  }
  function cielDe(h) {
    h = ((h % 24) + 24) % 24;
    let i = 0;
    while (i < CIEL.length - 2 && CIEL[i + 1][0] <= h) i++;
    const [h1, a1, b1] = CIEL[i], [h2, a2, b2] = CIEL[i + 1], k = (h - h1) / (h2 - h1 || 1);
    return `linear-gradient(${melange(a1, a2, k)}, ${melange(b1, b2, k)})`;
  }
  function nuitDe(h) {
    h = ((h % 24) + 24) % 24;
    if (h >= 21 || h < 5.5) return 1;
    if (h >= 18) return (h - 18) / 3;
    return h < 8 ? 1 - (h - 5.5) / 2.5 : 0;
  }
  function astres(h) {
    h = ((h % 24) + 24) % 24;
    const arc = (k) => ({ left: 4 + 92 * k, top: 62 - Math.sin(Math.PI * k) * 52 });
    const ks = (h - 6) / 14, hm = h >= 18 ? h - 18 : h + 6, kl = hm / 13;
    return { soleil: Object.assign(arc(clamp(ks, 0, 1)), { op: ks > 0 && ks < 1 ? 1 : 0 }), lune: Object.assign(arc(clamp(kl, 0, 1)), { op: nuitDe(h) }) };
  }
  const styleAstre = (a) => `left:${a.left}%;top:${a.top}%;opacity:${a.op}`;

  function sceneHtml(s, p, avatar) {
    const fin = s.fini, moy = moyenneSession(s);
    const w = fin ? V.semaines : s.semaine + 1;
    const d = dateDe(p, w, 0), sa = saison(d), me = meteo(w, sa);
    const relache = w === V.relache;
    const blocs = construireHoraire(p).blocs.filter((b) => !(relache && ["cours", "labo", "stage"].includes(b.type)));
    const h = fin ? 13 : 7, as = astres(h);
    const hud = fin ? "🎓 Session terminée !" : `Semaine ${w} · ${JOURS_COURTS[0]} ${d.getDate()} ${MOIS[d.getMonth()]} · 7:00`;
    const gouttes = me === "clair" ? "" : Array.from({ length: me === "pluie" ? 40 : 26 }, (_, i) =>
      `<i style="left:${(i * 37 + 11) % 100}%;animation-delay:-${((i * 0.37) % 3).toFixed(2)}s;animation-duration:${me === "pluie" ? (0.6 + (i % 5) * 0.08).toFixed(2) : (3 + (i % 5) * 0.6).toFixed(1)}s">${me === "neige" ? "❄" : me === "feuilles" ? (i % 2 ? "🍂" : "🍁") : ""}</i>`).join("");
    return `<div class="scene-wrap">
      <div class="scene s-${sa} meteo-${me}" id="scene" style="--nuit:${nuitDe(h).toFixed(2)}">
        <div class="ciel" id="sc-ciel" style="background:${cielDe(h)}"></div>
        <div class="etoiles">${Array.from({ length: 22 }, (_, i) => `<i style="left:${(i * 53 + 7) % 100}%;top:${(i * 29 + 5) % 48}%"></i>`).join("")}</div>
        <span class="astre" id="sc-soleil" style="${styleAstre(as.soleil)}">☀️</span><span class="astre" id="sc-lune" style="${styleAstre(as.lune)}">🌙</span>
        <span class="nuage n1">☁️</span><span class="nuage n2">☁️</span><span class="nuage n3">☁️</span>
        <div class="collines"></div>
        ${ARBRES.map((x, i) => `<span class="arbre" style="left:${x}%">${sa === "hiver" || i % 2 ? "🌲" : "🌳"}</span>`).join("")}
        ${LIEUX.map((l) => `<div class="lieu" style="left:${l.x}%"><i class="lumiere"></i><span>${l.k === "campus" ? (p.niveau === "uni" ? "🏛️" : "🏫") : l.ico}</span><small>${l.nom}</small></div>`).join("")}
        ${LAMPES.map((x) => `<div class="lampe" style="left:${x}%"><i></i></div>`).join("")}
        <div class="trottoir"></div><div class="route"><i class="ligne"></i></div>
        <div class="meteo">${gouttes}</div>
        <div class="joueur" id="avatar" style="left:${fin ? LIEU_X.campus : LIEU_X.maison}%"><span class="bulle" id="bulle">${fin ? (moy >= 60 ? "🎓" : "😮‍💨") : "🥣"}</span><span class="perso" id="perso">${avatar}</span><span class="humeur" id="humeur">${humeur(s)}</span></div>
        <div class="hud"><b id="sc-hud">${hud}</b><span class="hud-meteo" title="Météo de la semaine">${METEO_ICO[me]}</span></div>
        <div class="sc-ctrl" id="sc-ctrl" hidden>
          <button type="button" data-sc="pause" title="Pause">⏸</button>
          ${[1, 2, 4].map((v) => `<button type="button" data-sc="v" data-v="${v}" title="Vitesse ${v}×">${v}×</button>`).join("")}
          <button type="button" data-sc="passer" title="Passer la semaine">⏭</button>
        </div>
        <div class="sc-overlay" id="sc-overlay"></div>
      </div>
      <div class="jours-strip" id="sc-strip">${JOURS.map((jn, j) => `<div class="js-jour" data-j="${j}"><b>${jn}</b><div class="js-barre">${blocs.filter((b) => b.j === j).map((b) => `<i class="t-${b.type}" style="left:${((b.h - 7) / 16) * 100}%;width:${(b.n / 16) * 100}%"></i>`).join("")}</div></div>`).join("")}<span class="js-tete" id="sc-tete" hidden></span></div>
    </div>`;
  }

  /* Moteur image par image : l'horloge avance, le personnage marche d'un lieu à l'autre selon l'horaire,
     le ciel suit l'heure, les jauges évoluent en direct, puis l'imprévu et les examens s'affichent. */
  function animerSemaine(vue, o) {
    const scene = vue.querySelector("#scene");
    if (!scene || !animOn()) { o.fini(); return null; }
    const $ = (sel) => scene.querySelector(sel);
    const av = $("#avatar"), perso = $("#perso"), bulle = $("#bulle"), hum = $("#humeur"), hud = $("#sc-hud"), ciel = $("#sc-ciel"),
      soleil = $("#sc-soleil"), lune = $("#sc-lune"), ctrl = $("#sc-ctrl"), over = $("#sc-overlay");
    const strip = vue.querySelector("#sc-strip"), tete = vue.querySelector("#sc-tete");
    const { p, w } = o;
    const relache = w === V.relache;
    const blocs = construireHoraire(p).blocs.filter((b) => !(relache && ["cours", "labo", "stage"].includes(b.type)));
    const fin = { energie: o.s.energie, moral: o.s.moral, argent: o.s.argent, prep: o.s.prepN ? o.s.prepSum / o.s.prepN : null };
    const deb = { energie: o.avant.energie, moral: o.avant.moral, argent: o.avant.argent, prep: o.avant.prepN ? o.avant.prepSum / o.avant.prepN : null };
    const jauge = (k) => vue.querySelector(`.jauge[data-j="${k}"]`);
    const evtQuand = o.evt && (o.evt.id === "rentree" || o.evt.id === "relache") ? [0, 8.2] : [2, 12.5];
    let vit = o.vitesse, pause = false, arrete = false, raf = 0, last = performance.now();
    let j = 0, h = 7, x = LIEU_X.maison, dir = 1, phase = "jour", tPhase = 0, tAnim = 0, tFx = 0, hudTxt = "";
    let evtFait = !o.evt, examFait = !o.epreuve, tOuvert = 0;
    const bus = new Set(), vehicules = [];

    ctrl.hidden = false; tete.hidden = false;
    scene.classList.add("anime");
    const majCtrl = () => {
      ctrl.querySelectorAll("[data-v]").forEach((b) => b.classList.toggle("on", Number(b.dataset.v) === vit));
      ctrl.querySelector('[data-sc="pause"]').textContent = pause ? "▶" : "⏸";
    };
    majCtrl();

    function terminer() {
      if (arrete) return;
      arrete = true;
      cancelAnimationFrame(raf);
      scene.removeEventListener("click", surClic);
      vehicules.forEach((v) => v.el.remove());
      o.fini();
    }
    function surClic(e) {
      e.stopPropagation();
      const b = e.target.closest("[data-sc]");
      if (b) {
        if (b.dataset.sc === "passer") { terminer(); return; }
        if (b.dataset.sc === "pause") pause = !pause;
        if (b.dataset.sc === "v") { vit = Number(b.dataset.v); store.set("vie:vitesse", vit); }
        majCtrl();
        return;
      }
      if ((phase === "evt" || phase === "exam") && performance.now() - tOuvert > 600) tOuvert = -1e9;
    }
    scene.addEventListener("click", surClic);

    function fx(txt, px, cls = "") {
      const e = document.createElement("span");
      e.className = "fx " + cls; e.textContent = txt; e.style.left = px + "%";
      scene.appendChild(e);
      setTimeout(() => e.remove(), 1500);
    }
    const blocA = (hh) => blocs.find((b) => b.j === j && hh >= b.h && hh < b.h + b.n);
    const bientot = () => blocs.find((b) => b.j === j && b.h > h && b.h - h <= 2.5);

    function jauges(f) {
      const val = (k) => (deb[k] == null ? fin[k] : deb[k] + (fin[k] - deb[k]) * f);
      [["energie", 35, 60], ["moral", 35, 60], ["prep", 60, 80]].forEach(([k, ko, mid]) => {
        const el = jauge(k);
        if (!el || fin[k] == null) return;
        const v = val(k), i = el.querySelector(".barre i");
        i.style.width = clamp(v, 0, 100) + "%";
        i.className = v < ko ? "ko" : v < mid ? "mid" : "ok";
        el.querySelector("b").textContent = Math.round(v);
      });
      const ea = jauge("argent");
      if (ea) { const v = Math.round(val("argent")), b = ea.querySelector("b"); b.textContent = `${fmt(v, 0)} $`; b.className = v < 0 ? "neg" : "pos"; }
      hum.textContent = humeurDe(val("energie"), val("moral"));
    }

    function ouvrirEvt() {
      const ev = o.evt, e = ev.c.e || {};
      const chip = (v, ico, suffixe = "") => (v ? `<span class="chip ${v > 0 ? "pos" : "neg"}">${v > 0 ? "+" : "−"}${fmt(Math.abs(v), 0)}${suffixe} ${ico}</span>` : "");
      over.innerHTML = `<div class="sc-evt"><span class="sc-evt-ico">${ev.ico}</span><div>
        <small>${JOURS_COURTS[j]} · imprévu</small><b>${esc(ev.t)}</b>
        <p>Ton choix : <b>${esc(ev.c.t)}</b></p>
        <div class="chips">${chip(e.energie, "⚡")}${chip(e.moral, "🙂")}${chip(e.argent, "💵", " $")}${chip(e.prep, "📚")}${e.travail ? `<span class="chip neu">${e.travail > 0 ? "+" : "−"}${Math.abs(e.travail)} h d'emploi 💼</span>` : ""}${e.temps ? `<span class="chip neu">${e.temps} h de ton temps ⏱️</span>` : ""}</div>
        <small class="sc-continuer">Clique pour continuer</small></div></div>`;
      over.classList.add("on");
      bulle.textContent = ev.ico;
      fx(ev.ico, x, "gros");
      phase = "evt"; tPhase = 0; tOuvert = performance.now();
    }
    function ouvrirExam() {
      const ep = o.epreuve, verdict = ep.n >= 85 ? "Excellent !" : ep.n >= 70 ? "Réussi" : ep.n >= 60 ? "De justesse" : "Échec 😬";
      over.innerHTML = `<div class="copie"><span class="copie-ico">📝</span><b>${esc(ep.t)}</b><strong class="note">0 %</strong><span class="tampon ${ep.n >= 60 ? "ok" : "ko"}">${verdict}</span></div>`;
      over.classList.add("on");
      bulle.textContent = "📝";
      phase = "exam"; tPhase = 0; tOuvert = performance.now();
    }
    function fermer() { over.classList.remove("on"); phase = "jour"; }

    // Ce que fait le personnage quand il n'a rien à l'horaire, selon l'endroit où il se trouve.
    function attente(px) {
      const ici = LIEUX.reduce((a, l) => (Math.abs(l.x - px) < Math.abs(a.x - px) ? l : a));
      if (ici.k === "campus") return h >= 11.5 && h < 13.5 ? "🥪" : "💬";
      if (ici.k === "travail") return "⏳";
      if (ici.k === "sorties") return "☕";
      if (ici.k === "sport") return "💧";
      return h < 8.5 ? "🥣" : h >= 17.5 && h < 19.5 ? "🍝" : j > 4 ? "🎮" : ["📺", "📱", "🧹"][Math.floor(h) % 3];
    }
    function vehicule(ico, sens) {
      const el = document.createElement("span");
      el.className = "vehicule"; el.textContent = ico;
      el.style.transform = sens > 0 ? "scaleX(-1)" : "";
      scene.appendChild(el);
      vehicules.push({ el, x: sens > 0 ? -12 : 112, v: sens * (ico === "🚌" ? 32 : 48) });
    }

    function image(now) {
      if (arrete) return;
      const reel = Math.min(0.25, (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(image);
      if (pause) return;
      const dt = reel * vit;
      tAnim += dt;

      // Écrans d'imprévu et d'examen : l'horloge s'arrête.
      if (phase === "evt") { tPhase = (now - tOuvert) / 1000; if (tPhase > 3.6) fermer(); return; }
      if (phase === "exam") {
        tPhase = (now - tOuvert) / 1000;
        const k = Math.min(1, tPhase / 1);
        over.querySelector(".note").textContent = Math.round(o.epreuve.n * k) + " %";
        if (k >= 1 && !over.querySelector(".tampon.on")) {
          over.querySelector(".tampon").classList.add("on");
          if (o.epreuve.n >= 80) for (let i = 0; i < 6; i++) setTimeout(() => !arrete && fx(hasard(["⭐", "🌟", "✨"]), 30 + Math.random() * 40, "gros"), i * 90);
        }
        if (tPhase > 2.6) fermer();
        return;
      }

      const b = phase === "jour" ? blocA(h) : null;
      const nb = phase === "jour" && !b ? bientot() : null;
      const diner = phase === "jour" && !b && j < 5 && h >= 11.5 && h < 13.5 && Math.abs(x - LIEU_X.campus) < 1;
      let cible = LIEU_X.maison;
      if (phase === "jour") cible = b ? LIEU_X[lieuDe(b)] : nb ? LIEU_X[lieuDe(nb)] : diner ? x : LIEU_X.maison;
      const d = cible - x, marche = Math.abs(d) > 0.2 && phase !== "nuit";
      if (marche) { x += Math.sign(d) * Math.min(Math.abs(d), 75 * dt); dir = Math.sign(d); }

      let hAff = h;
      if (phase === "jour") {
        // L'horloge s'arrête pendant les trajets et ne saute jamais un bloc de l'horaire.
        const bornes = blocs.filter((x) => x.j === j).flatMap((x) => [x.h - 2.5, x.h, x.h + x.n]).filter((t) => t > h + 1e-6);
        const borne = bornes.length ? Math.min(...bornes) : 23;
        h = Math.min(h + (marche ? 0 : b ? 7 : 20) * dt, borne, 23);
        if (!evtFait && j === evtQuand[0] && h >= evtQuand[1]) { evtFait = true; ouvrirEvt(); }
        else if (!examFait && j === 3 && h >= 10) { examFait = true; ouvrirExam(); }
        if (h >= 23) { h = 23; phase = "rentre"; }
        hAff = h;
      } else if (phase === "rentre") {
        if (!marche) { phase = "nuit"; tPhase = 0; av.classList.add("dort"); }
      } else if (phase === "nuit") {
        tPhase += dt;
        hAff = 23 + 8 * Math.min(1, tPhase / 0.55);
        if (tPhase - tFx > 0.16) { tFx = tPhase; fx("💤", LIEU_X.maison + 1, "zz"); }
        if (tPhase >= 0.55) {
          j++; h = 7; hAff = 7; tFx = 0;
          av.classList.remove("dort");
          if (j >= 7) { jauges(1); terminer(); return; }
          phase = "jour";
          if (p.sommeil < 7) fx("🥱", x, "gros");
        }
      }

      // Personnage.
      av.style.left = x + "%";
      let bob = Math.sin(tAnim * 3) * 1.5, rot = 0;
      if (marche) { bob = Math.abs(Math.sin(tAnim * 16)) * 5; rot = Math.sin(tAnim * 16) * 6; }
      else if (b && b.type === "sport") bob = Math.abs(Math.sin(tAnim * 9)) * 16;
      else if (b && b.type === "sorties") { rot = Math.sin(tAnim * 10) * 14; bob = Math.abs(Math.sin(tAnim * 10)) * 4; }
      perso.style.transform = `translateY(${-bob}px) rotate(${rot}deg) scaleX(${dir < 0 ? -1 : 1})`;
      const dest = LIEUX.find((l) => l.x === cible);
      const ico = phase === "nuit" || phase === "rentre" && !marche ? "💤" : marche ? (dest.k === "campus" ? (p.niveau === "uni" ? "🏛️" : "🏫") : dest.ico)
        : b ? ACT_ICO[b.type] : attente(x);
      if (bulle.textContent !== ico) bulle.textContent = ico;
      if (b && !marche && tAnim - tFx > 0.5) { tFx = tAnim; fx(hasard(PARTICULES[b.type] || ["✨"]), x + (Math.random() * 6 - 3)); }

      // Véhicules : autobus matin et soir, quelques autos.
      const cle = j + (h < 12 ? "m" : "s");
      if (phase === "jour" && ((h > 7.6 && h < 8.6) || (h > 16.8 && h < 17.8)) && !bus.has(cle)) { bus.add(cle); vehicule("🚌", Math.random() < 0.5 ? 1 : -1); }
      if (phase === "jour" && Math.random() < dt * 0.25) vehicule(hasard(["🚗", "🚙", "🚕", "🚲"]), Math.random() < 0.5 ? 1 : -1);
      for (let i = vehicules.length - 1; i >= 0; i--) {
        const v = vehicules[i];
        v.x += v.v * dt;
        v.el.style.left = v.x + "%";
        if (v.x < -15 || v.x > 115) { v.el.remove(); vehicules.splice(i, 1); }
      }

      // Ciel, astres, horloge, bandeau des jours et jauges.
      ciel.style.background = cielDe(hAff);
      scene.style.setProperty("--nuit", nuitDe(hAff).toFixed(3));
      const as = astres(hAff);
      soleil.style.cssText = styleAstre(as.soleil);
      lune.style.cssText = styleAstre(as.lune);
      const hh = Math.floor(hAff) % 24, mm = Math.floor(((hAff % 1) * 60) / 15) * 15;
      const dj = dateDe(p, w, Math.min(j, 6));
      const t = `Semaine ${w} · ${JOURS_COURTS[Math.min(j, 6)]} ${dj.getDate()} ${MOIS[dj.getMonth()]} · ${hh}:${String(mm).padStart(2, "0")}`;
      if (t !== hudTxt) { hudTxt = t; hud.textContent = t; }
      const pos = (j + (Math.min(hAff, 23) - 7) / 16) / 7;
      tete.style.left = pos * 100 + "%";
      strip.querySelectorAll(".js-jour").forEach((c, i) => { c.classList.toggle("fait", i < j); c.classList.toggle("en-cours", i === j); });
      jauges(clamp(pos, 0, 1));
    }
    raf = requestAnimationFrame(image);
    return terminer;
  }

  /* Petits effets après une semaine : jauges qui glissent, chiffres qui défilent. */
  function effets(vue) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      vue.querySelectorAll("[data-to]").forEach((el) => (el.style.width = el.dataset.to + "%"));
      vue.querySelectorAll("[data-a]").forEach((el) => {
        const de = Number(el.dataset.de), a = Number(el.dataset.a), argent = el.dataset.fmt === "argent";
        if (de === a || !animOn()) return;
        const t0 = performance.now();
        const pas = (t) => {
          const k = Math.min(1, (t - t0) / 800), v = Math.round(de + (a - de) * (1 - Math.pow(1 - k, 3)));
          el.textContent = argent ? `${fmt(v, 0)} $` : v;
          if (k < 1) requestAnimationFrame(pas);
        };
        requestAnimationFrame(pas);
      });
    }));
  }

  function confettis(vue) {
    if (!animOn()) return;
    const box = document.createElement("div"); box.className = "confettis"; box.setAttribute("aria-hidden", "true");
    const couleurs = ["#ff5d8f", "#ffd166", "#06d6a0", "#4cc9f0", "#8b5cf6", "#ff8c42"];
    box.innerHTML = Array.from({ length: 90 }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${couleurs[i % couleurs.length]};animation-delay:${(Math.random() * 0.8).toFixed(2)}s;animation-duration:${(2.2 + Math.random() * 1.6).toFixed(2)}s;transform:rotate(${Math.round(Math.random() * 360)}deg)"></i>`).join("");
    vue.appendChild(box);
    setTimeout(() => box.remove(), 4500);
  }

  function trophees(s, p) {
    const moy = moyenneSession(s), pr = profil(p);
    const moyE = s.hist.reduce((a, h) => a + h.energie, 0) / s.hist.length;
    const moyM = s.hist.reduce((a, h) => a + h.moral, 0) / s.hist.length;
    const T = [
      ["🦉", "Studieux", "Tu as étudié autant que tes cours le demandent.", etude(p) >= heuresPerso(pr)],
      ["😴", "Bien reposé", "8 h de sommeil et une bonne énergie moyenne.", p.sommeil >= 8 && moyE >= 60],
      ["💸", "Économe", "Tu finis la session avec plus d'argent qu'au départ.", s.argent >= (num(p.economies) || 0)],
      ["🎉", "Vie sociale", "Un moral moyen de 70 ou plus.", moyM >= 70],
      ["🏆", "Tête de classe", "Une moyenne de 85 % ou plus.", moy >= 85],
      ["💪", "Persévérant", "Tes examens finaux battent ta mi-session.", (s.notes.fin ?? 0) > (s.notes.mi ?? 0)],
      ["🚀", "Futur stagiaire", "Tu as postulé pour un stage d'été.", s.stageEte],
    ];
    const n = T.filter((t) => t[3]).length;
    return `<div class="panel trophees"><h3 class="h4">Trophées : ${n} sur ${T.length}</h3>
      <div class="trophee-grille">${T.map(([ico, nom, d, ok], i) => `<div class="trophee ${ok ? "ok" : "verrou"}" style="animation-delay:${i * 0.12}s" title="${esc(d)}"><span>${ok ? ico : "🔒"}</span><b>${esc(nom)}</b><small>${esc(d)}</small></div>`).join("")}</div></div>`;
  }

  function jauges(s, a) {
    const moy = s.prepN ? s.prepSum / s.prepN : null;
    const moyA = a && a.prepN ? a.prepSum / a.prepN : null;
    const delta = (d, suffixe = "") => (d ? `<em class="delta ${d > 0 ? "pos" : "neg"}">${d > 0 ? "+" : "−"}${fmt(Math.abs(d), 0)}${suffixe}</em>` : "");
    const j = (k, t, v, va, cls) => {
      const de = a && va != null && !a.live ? va : v;
      const d = a && va != null ? Math.round(v) - Math.round(va) : 0;
      return `<div class="jauge" data-j="${k}"><span>${t}</span><div class="barre"><i class="${cls}" style="width:${clamp(de, 0, 100)}%" data-to="${clamp(v, 0, 100)}"></i></div><b data-de="${Math.round(de)}" data-a="${Math.round(v)}">${Math.round(de)}</b>${delta(d)}</div>`;
    };
    const dA = a ? s.argent - a.argent : 0;
    return `<div class="jauges">
      ${j("energie", "⚡ Énergie", s.energie, a?.energie, s.energie < 35 ? "ko" : s.energie < 60 ? "mid" : "ok")}
      ${j("moral", "🙂 Moral", s.moral, a?.moral, s.moral < 35 ? "ko" : s.moral < 60 ? "mid" : "ok")}
      ${moy == null ? `<div class="jauge"><span>📚 Préparation</span><div class="barre"><i></i></div><b>—</b></div>` : j("prep", "📚 Préparation", moy, moyA, moy < 60 ? "ko" : moy < 80 ? "mid" : "ok")}
      <div class="jauge argent" data-j="argent"><span>💵 Argent</span><span></span><b class="${s.argent < 0 ? "neg" : "pos"}" data-fmt="argent" data-de="${a && !a.live ? a.argent : s.argent}" data-a="${s.argent}">${fmt(a && !a.live ? a.argent : s.argent, 0)} $</b>${delta(dA, " $")}</div>
    </div>`;
  }

  function simulationHtml(s, p, avatar, transition) {
    if (!s) {
      return `<div class="panel sim-debut">
        <h2 class="h3">Vis ta première session, semaine par semaine</h2>
        <p>Pendant ${V.semaines} semaines, ton personnage vit ta vraie semaine : cours, étude, emploi, sport, sorties, dodo. Des imprévus arrivent (grippe, party, quart de travail de plus, bourse…) et tu choisis quoi faire. Tes choix font bouger ton énergie, ton moral, ta préparation et ton argent, jusqu'aux examens de mi-session (semaine ${V.examens[0]}) et de fin de session.</p>
        <p><b>Choisis ton personnage</b></p>
        <div class="avatars">${AVATARS.map((a) => `<button type="button" class="avatar-choix ${a === avatar ? "on" : ""}" data-avatar="${a}" aria-label="Personnage ${a}">${a}</button>`).join("")}</div>
        <p class="small muted">Tes réglages ci-dessus servent de point de départ ; tu peux les changer entre deux semaines.</p>
        <button class="btn" data-act="demarrer">🎮 Commencer la session</button>
      </div>`;
    }
    if (s.profil !== p.profil) {
      return `<div class="panel"><p>Tu as changé de programme : la session en cours était en ${esc(V.profils[s.profil]?.nom || "")}.</p>
        <button class="btn" data-act="demarrer">Recommencer avec ${esc(profil(p).nom)}</button></div>`;
    }
    const ev = s.evt ? evtDef(s.evt) : null;
    const b = bilan(p);
    const a = transition && transition.avant;
    const graph = s.hist.length > 1 ? `<details class="panel"><summary><b>Courbes de la session</b></summary><svg class="courbes" viewBox="0 0 300 100" role="img" aria-label="Évolution de l'énergie, du moral et de la préparation">
        ${[25, 50, 75].map((v) => `<line x1="10" x2="290" y1="${90 - v * 0.8}" y2="${90 - v * 0.8}" class="grille"/>`).join("")}
        ${courbe(s.hist, "energie", "var(--ok)")}${courbe(s.hist, "moral", "var(--brand-2)")}${courbe(s.hist, "prep", "var(--brand)")}
      </svg><div class="legende"><span><i style="background:var(--ok)"></i>Énergie</span><span><i style="background:var(--brand-2)"></i>Moral</span><span><i style="background:var(--brand)"></i>Préparation</span></div></details>` : "";
    const w = s.semaine + 1;
    return `
      ${s.fini ? rapport(s, p) + trophees(s, p) : `
      <div class="panel sim-tete">
        <div><span class="muted small">${esc(profil(p).nom)}</span><h2 class="h3">Semaine ${w} sur ${V.semaines}${w === V.relache ? " · 🏖️ relâche" : V.examens.includes(w) ? " · 📝 examens" : ""}</h2></div>
        <div class="progress"><i style="width:${(s.semaine / V.semaines) * 100}%"></i></div>
      </div>`}
      ${sceneHtml(s, p, avatar)}
      ${jauges(s, a)}
      ${!s.fini && ev ? `<div class="panel evt ${transition ? "pop" : ""}"><span class="evt-ico" aria-hidden="true">${EVT_ICO[s.evt] || "⚠️"}</span><div><b>${esc(ev.t)}</b>
        <div class="row-actions">${ev.choix.map((c, i) => `<button class="btn ${s.choix === i ? "" : "ghost"} small" data-choix="${i}">${esc(c.t)}</button>`).join("")}</div></div></div>` : ""}
      ${!s.fini ? `
      ${b.libre < 0 ? `<p class="badge warn">Ta semaine dépasse 168 heures de ${fmt(-b.libre, 1)} h : tu vas manquer de sommeil.</p>` : ""}
      <div class="row-actions sim-actions">
        <button class="btn" data-act="semaine" ${ev && s.choix == null ? "disabled title=\"Choisis d'abord quoi faire\"" : ""}>▶ Vivre la semaine ${w}</button>
        <button class="btn ghost" data-act="auto">⏩ Simuler jusqu'à la fin</button>
        <button class="btn ghost" data-act="demarrer">↺ Recommencer</button>
        <label class="anim-toggle"><input type="checkbox" data-anim ${animOn() ? "checked" : ""}> 🎬 Animations</label>
      </div>` : `<div class="row-actions"><button class="btn" data-act="demarrer">↺ Refaire une session</button><label class="anim-toggle"><input type="checkbox" data-anim ${animOn() ? "checked" : ""}> 🎬 Animations</label></div>`}
      ${graph}
      ${s.journal.length ? `<h3 class="h4">Journal</h3><ol class="journal">${s.journal.map((j, i) => `<li class="${i === 0 && transition ? "neuf" : ""}"><span class="tl-date">Semaine ${j.w}</span>${j.lignes.map((l) => `<p class="small">${l}</p>`).join("")}</li>`).join("")}</ol>` : ""}`;
  }

  /* ---------- Page ---------- */
  function vie(app, params) {
    const p = Object.assign({}, DEFAUT, store.get("vie:params", {}));
    if (params.get("niveau") === "cegep" || params.get("niveau") === "uni") {
      if (p.niveau !== params.get("niveau")) { p.niveau = params.get("niveau"); p.profil = p.niveau === "uni" ? "uni-genie" : "cegep-sciences"; p.etude = null; }
    }
    let onglet = params.get("vue") === "simulation" ? "simulation" : (params.get("vue") === "horaire" ? "horaire" : store.get("vie:onglet", "horaire"));
    let s = store.get("vie:sim", null);
    let avatar = store.get("vie:avatar", AVATARS[0]);
    let stopAnim = null;
    const villes = Object.keys(CE.LOYERS).filter((v) => v !== "_region");
    const sauver = () => { store.set("vie:params", p); store.set("vie:sim", s); store.set("vie:onglet", onglet); };

    const slider = (k, t, min, max, pas, unite) => `<label>${t} <output id="o-${k}">${fmt(k === "etude" ? etude(p) : p[k], pas < 1 ? 1 : 0)} ${unite}</output>
      <input type="range" data-k="${k}" min="${min}" max="${max}" step="${pas}" value="${k === "etude" ? etude(p) : p[k]}"></label>`;

    function rendre() {
      const profils = Object.entries(V.profils).filter(([, x]) => x.niveau === p.niveau);
      app.innerHTML = page({
        titre: "Vie étudiante : horaire et simulation",
        intro: "À quoi ressemble vraiment une semaine au cégep ou à l'université ? Règle ta situation : l'horaire type se dessine tout seul. Ensuite, vis une session complète de 15 semaines avec ses examens, ses imprévus et ton budget.",
        retour: { href: p.niveau === "uni" ? "#/cegep" : "#/secondaire", label: p.niveau === "uni" ? "Cégep" : "Secondaire" },
        contenu: `
        <div class="seg" id="niv"><button data-n="cegep" class="${p.niveau === "cegep" ? "on" : ""}">Au cégep</button><button data-n="uni" class="${p.niveau === "uni" ? "on" : ""}">À l'université</button></div>
        <div class="panel">
          <div class="filters">
            <label>Programme <select id="profil">${profils.map(([k, x]) => `<option value="${k}" ${k === p.profil ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></label>
            <label>Logement <select id="logement">${Object.entries(CE.LOGEMENT_TYPES).map(([k, v]) => `<option value="${k}" ${k === p.logement ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
            <label>Ville <select id="ville">${villes.map((v) => `<option ${v === p.ville ? "selected" : ""}>${esc(v)}</option>`).join("")}<option value="_region" ${p.ville === "_region" ? "selected" : ""}>Autre ville en région</option></select></label>
            <label>Économies au départ <input id="economies" inputmode="numeric" value="${esc(p.economies)}" class="w-sm"></label>
            <label>Aide par mois (parents, AFE) <input id="parents" inputmode="numeric" value="${esc(p.parents)}" class="w-sm"></label>
          </div>
          <div class="sliders">
            ${slider("etude", "Étude et travaux", 0, 50, 1, "h/sem.")}
            ${slider("travail", "Emploi", 0, 35, 1, "h/sem.")}
            ${slider("sommeil", "Sommeil", 5, 10, 0.5, "h/nuit")}
            ${slider("sorties", "Amis et sorties", 0, 20, 1, "h/sem.")}
            ${slider("sport", "Sport", 0, 12, 1, "h/sem.")}
            ${slider("trajet", "Trajet (aller)", 0, 120, 5, "min")}
          </div>
          <div id="bilan"></div>
        </div>
        <div class="seg" id="onglets"><button data-o="horaire" class="${onglet === "horaire" ? "on" : ""}">🗓️ Horaire type</button><button data-o="simulation" class="${onglet === "simulation" ? "on" : ""}">🎮 Simuler une session</button></div>
        <div id="vue"></div>`,
      });
      brancher();
      maj();
    }

    function maj(transition) {
      const b = bilan(p);
      app.querySelector("#bilan").innerHTML = `
        <div class="semaine168" role="img" aria-label="Répartition des 168 heures de la semaine">
          ${b.parts.map((x) => `<i class="t-${x.k}" style="flex:${Math.max(x.h, 0)}" title="${x.t} : ${fmt(x.h, 1)} h"></i>`).join("")}${b.libre > 0 ? `<i class="t-libre" style="flex:${b.libre}" title="Temps libre : ${fmt(b.libre, 1)} h"></i>` : ""}
        </div>
        <div class="legende">${b.parts.map((x) => `<span><i class="t-${x.k}"></i>${x.t} ${fmt(x.h, 1)} h</span>`).join("")}<span><i class="t-libre"></i>Temps libre ${fmt(b.libre, 1)} h</span></div>
        <p class="small"><b>Charge de travail : ${fmt(b.charge, 0)} h par semaine</b> (cours, étude et emploi)${b.charge > 55 ? ' <span class="badge ko">très lourde</span>' : b.charge > 45 ? ' <span class="badge mid">lourde, comme un emploi à temps plein et plus</span>' : ' <span class="badge ok">raisonnable</span>'}
        · Revenus d'emploi ≈ ${fmt(p.travail * CE.SALAIRE_MIN * 0.87, 0)} $ net par semaine · Dépenses ≈ ${fmt(depensesSemaine(p, p.sorties), 0)} $ par semaine</p>`;
      const vue = app.querySelector("#vue");
      if (stopAnim && !transition) { const f = stopAnim; stopAnim = null; f(); return; }
      vue.innerHTML = onglet === "horaire" ? horaireHtml(p) : simulationHtml(s, p, avatar, transition);
      vue.classList.toggle("jeu-anim", animOn());
      if (transition && onglet === "simulation") {
        effets(vue);
        if (s && s.fini && !transition.avant.fini && moyenneSession(s) >= 75) confettis(vue);
      }
      sauver();
    }

    function brancher() {
      app.querySelector("#niv").onclick = (e) => {
        const n = e.target.dataset.n; if (!n || n === p.niveau) return;
        p.niveau = n; p.profil = n === "uni" ? "uni-genie" : "cegep-sciences"; p.etude = null; rendre();
      };
      app.querySelector("#onglets").onclick = (e) => { const o = e.target.closest("[data-o]"); if (!o) return; onglet = o.dataset.o; rendre(); };
      app.querySelector("#profil").onchange = (e) => { p.profil = e.target.value; p.etude = null; rendre(); };
      ["logement", "ville"].forEach((k) => (app.querySelector("#" + k).onchange = (e) => { p[k] = e.target.value; maj(); }));
      ["economies", "parents"].forEach((k) => (app.querySelector("#" + k).oninput = (e) => { p[k] = num(e.target.value) ?? 0; maj(); }));
      app.querySelectorAll('input[type="range"]').forEach((r) => (r.oninput = () => {
        p[r.dataset.k] = Number(r.value);
        app.querySelector("#o-" + r.dataset.k).textContent = `${fmt(Number(r.value), Number(r.step) < 1 ? 1 : 0)} ${app.querySelector("#o-" + r.dataset.k).textContent.split(" ").slice(1).join(" ")}`;
        maj();
      }));
      app.querySelector("#vue").onchange = (e) => { if (e.target.matches("[data-anim]")) { store.set("vie:anim", e.target.checked); maj(); } };
      app.querySelector("#vue").onclick = (e) => {
        const vue = app.querySelector("#vue");
        if (stopAnim) return;
        const av = e.target.closest("[data-avatar]");
        if (av) { avatar = av.dataset.avatar; store.set("vie:avatar", avatar); maj(); return; }
        const c = e.target.closest("[data-choix]");
        if (c) { s.choix = Number(c.dataset.choix); maj(); return; }
        const a = e.target.closest("[data-act]"); if (!a) return;
        const instantane = () => ({ energie: s.energie, moral: s.moral, argent: s.argent, prepSum: s.prepSum, prepN: s.prepN, fini: s.fini });
        if (a.dataset.act === "demarrer") { s = nouvelleSim(p); s.evt = tirerEvenement(s, p); maj(); return; }
        if (a.dataset.act === "auto" && s) {
          const avant = instantane();
          while (!s.fini) vivreSemaine(s, p);
          maj({ avant });
          vue.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (a.dataset.act === "semaine" && s && !s.fini) {
          const avant = instantane();
          const quiz = s.evt && evtDef(s.evt).quiz;
          vivreSemaine(s, p);
          const w = s.semaine;
          const epreuve = w === V.examens[0] ? { t: "Examens de mi-session", n: s.notes.mi }
            : w === V.examens[1] ? { t: "Examens finaux", n: s.notes.fin }
            : quiz ? { t: "Quiz surprise", n: s.quiz[s.quiz.length - 1] } : null;
          vue.querySelectorAll(".sim-actions button, .evt button").forEach((x) => (x.disabled = true));
          const scene = vue.querySelector("#scene");
          if (scene) { const r = scene.getBoundingClientRect(); if (r.top < 80 || r.bottom > innerHeight) window.scrollBy({ top: r.top - 90, behavior: "smooth" }); }
          const jr = s.journal[0], evd = jr.evt ? evtDef(jr.evt) : null;
          const evt = evd ? { id: jr.evt, ico: EVT_ICO[jr.evt] || "⚠️", t: evd.t, c: evd.choix[jr.choix] || evd.choix[0] } : null;
          avant.live = animOn();
          stopAnim = animerSemaine(vue, { s, p, w, avant, epreuve, evt, vitesse: store.get("vie:vitesse", 2), fini: () => { stopAnim = null; maj({ avant }); } });
        }
      };
    }

    rendre();
  }

  window.VIE = { vie, _construireHoraire: construireHoraire, _bilan: bilan };
})();
