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
    s.journal.unshift({ w, lignes });
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

  function jauges(s) {
    const moy = s.prepN ? s.prepSum / s.prepN : null;
    const j = (t, v, cls, txt) => `<div class="jauge"><span>${t}</span><div class="barre"><i class="${cls}" style="width:${clamp(v, 0, 100)}%"></i></div><b>${txt}</b></div>`;
    return `<div class="jauges">
      ${j("⚡ Énergie", s.energie, s.energie < 35 ? "ko" : s.energie < 60 ? "mid" : "ok", Math.round(s.energie))}
      ${j("🙂 Moral", s.moral, s.moral < 35 ? "ko" : s.moral < 60 ? "mid" : "ok", Math.round(s.moral))}
      ${j("📚 Préparation", moy ?? 0, moy == null ? "" : moy < 60 ? "ko" : moy < 80 ? "mid" : "ok", moy == null ? "—" : Math.round(moy))}
      <div class="jauge"><span>💵 Argent</span><b class="${s.argent < 0 ? "neg" : "pos"}">${fmt(s.argent, 0)} $</b></div>
    </div>`;
  }

  function simulationHtml(s, p) {
    if (!s) {
      return `<div class="panel">
        <h2 class="h3">Vis ta première session, semaine par semaine</h2>
        <p>Pendant ${V.semaines} semaines, tu gères ton temps : étude, emploi, sommeil, amis, sport. Des imprévus arrivent (grippe, party, quart de travail de plus, bourse…) et tu choisis quoi faire. Tes choix font bouger ton énergie, ton moral, ta préparation et ton argent, jusqu'aux examens de mi-session (semaine ${V.examens[0]}) et de fin de session.</p>
        <p class="small muted">Tes réglages ci-dessus servent de point de départ ; tu peux les changer entre deux semaines.</p>
        <button class="btn" data-act="demarrer">Commencer la session</button>
      </div>`;
    }
    if (s.profil !== p.profil) {
      return `<div class="panel"><p>Tu as changé de programme : la session en cours était en ${esc(V.profils[s.profil]?.nom || "")}.</p>
        <button class="btn" data-act="demarrer">Recommencer avec ${esc(profil(p).nom)}</button></div>`;
    }
    const ev = s.evt ? evtDef(s.evt) : null;
    const b = bilan(p);
    const graph = s.hist.length > 1 ? `<svg class="courbes" viewBox="0 0 300 100" role="img" aria-label="Évolution de l'énergie, du moral et de la préparation">
        ${[25, 50, 75].map((v) => `<line x1="10" x2="290" y1="${90 - v * 0.8}" y2="${90 - v * 0.8}" class="grille"/>`).join("")}
        ${courbe(s.hist, "energie", "var(--ok)")}${courbe(s.hist, "moral", "var(--brand-2)")}${courbe(s.hist, "prep", "var(--brand)")}
      </svg><div class="legende"><span><i style="background:var(--ok)"></i>Énergie</span><span><i style="background:var(--brand-2)"></i>Moral</span><span><i style="background:var(--brand)"></i>Préparation</span></div>` : "";
    return `
      ${s.fini ? rapport(s, p) : `
      <div class="panel sim-tete">
        <div><span class="muted small">${esc(profil(p).nom)}</span><h2 class="h3">Semaine ${s.semaine + 1} sur ${V.semaines}${s.semaine + 1 === V.relache ? " · relâche" : V.examens.includes(s.semaine + 1) ? " · examens" : ""}</h2></div>
        <div class="progress"><i style="width:${(s.semaine / V.semaines) * 100}%"></i></div>
      </div>`}
      ${jauges(s)}
      ${graph}
      ${!s.fini && ev ? `<div class="panel evt"><b>${esc(ev.t)}</b>
        <div class="row-actions">${ev.choix.map((c, i) => `<button class="btn ${s.choix === i ? "" : "ghost"} small" data-choix="${i}">${esc(c.t)}</button>`).join("")}</div></div>` : ""}
      ${!s.fini ? `
      ${b.libre < 0 ? `<p class="badge warn">Ta semaine dépasse 168 heures de ${fmt(-b.libre, 1)} h : tu vas manquer de sommeil.</p>` : ""}
      <div class="row-actions">
        <button class="btn" data-act="semaine" ${ev && s.choix == null ? "disabled title=\"Choisis d'abord quoi faire\"" : ""}>Vivre la semaine ${s.semaine + 1}</button>
        <button class="btn ghost" data-act="auto">Simuler jusqu'à la fin</button>
        <button class="btn ghost" data-act="demarrer">Recommencer</button>
      </div>` : `<div class="row-actions"><button class="btn" data-act="demarrer">Refaire une session</button></div>`}
      ${s.journal.length ? `<h3 class="h4">Journal</h3><ol class="journal">${s.journal.map((j) => `<li><span class="tl-date">Semaine ${j.w}</span>${j.lignes.map((l) => `<p class="small">${l}</p>`).join("")}</li>`).join("")}</ol>` : ""}`;
  }

  /* ---------- Page ---------- */
  function vie(app, params) {
    const p = Object.assign({}, DEFAUT, store.get("vie:params", {}));
    if (params.get("niveau") === "cegep" || params.get("niveau") === "uni") {
      if (p.niveau !== params.get("niveau")) { p.niveau = params.get("niveau"); p.profil = p.niveau === "uni" ? "uni-genie" : "cegep-sciences"; p.etude = null; }
    }
    let onglet = params.get("vue") === "simulation" ? "simulation" : (params.get("vue") === "horaire" ? "horaire" : store.get("vie:onglet", "horaire"));
    let s = store.get("vie:sim", null);
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

    function maj() {
      const b = bilan(p);
      app.querySelector("#bilan").innerHTML = `
        <div class="semaine168" role="img" aria-label="Répartition des 168 heures de la semaine">
          ${b.parts.map((x) => `<i class="t-${x.k}" style="flex:${Math.max(x.h, 0)}" title="${x.t} : ${fmt(x.h, 1)} h"></i>`).join("")}${b.libre > 0 ? `<i class="t-libre" style="flex:${b.libre}" title="Temps libre : ${fmt(b.libre, 1)} h"></i>` : ""}
        </div>
        <div class="legende">${b.parts.map((x) => `<span><i class="t-${x.k}"></i>${x.t} ${fmt(x.h, 1)} h</span>`).join("")}<span><i class="t-libre"></i>Temps libre ${fmt(b.libre, 1)} h</span></div>
        <p class="small"><b>Charge de travail : ${fmt(b.charge, 0)} h par semaine</b> (cours, étude et emploi)${b.charge > 55 ? ' <span class="badge ko">très lourde</span>' : b.charge > 45 ? ' <span class="badge mid">lourde, comme un emploi à temps plein et plus</span>' : ' <span class="badge ok">raisonnable</span>'}
        · Revenus d'emploi ≈ ${fmt(p.travail * CE.SALAIRE_MIN * 0.87, 0)} $ net par semaine · Dépenses ≈ ${fmt(depensesSemaine(p, p.sorties), 0)} $ par semaine</p>`;
      app.querySelector("#vue").innerHTML = onglet === "horaire" ? horaireHtml(p) : simulationHtml(s, p);
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
      app.querySelector("#vue").onclick = (e) => {
        const c = e.target.closest("[data-choix]");
        if (c) { s.choix = Number(c.dataset.choix); maj(); return; }
        const a = e.target.closest("[data-act]"); if (!a) return;
        if (a.dataset.act === "demarrer") { s = nouvelleSim(p); s.evt = tirerEvenement(s, p); }
        if (a.dataset.act === "semaine" && s && !s.fini) vivreSemaine(s, p);
        if (a.dataset.act === "auto" && s) while (!s.fini) vivreSemaine(s, p);
        maj();
        if (a.dataset.act !== "demarrer") app.querySelector("#vue").scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }

    rendre();
  }

  window.VIE = { vie, _construireHoraire: construireHoraire, _bilan: bilan };
})();
