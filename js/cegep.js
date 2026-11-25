/* Volet cégep : cote R, prévision, intérêts universitaires, admissibilité, classement. */
(function () {
  const { esc, store, page, fmt, num, bac, uni, dec, decCode, debounce } = UI;
  const RET = { href: "#/cegep", label: "Cégep" };

  /* Pondération des échecs (note < 60) selon la règle du BCI. */
  const POIDS_ECHEC_S1 = 0.25;
  const POIDS_ECHEC = 0.5;

  /* ---------- Accueil ---------- */
  function accueil(app) {
    const r = store.get("coteR", null);
    app.innerHTML = page({
      titre: "Je suis au cégep",
      intro: "Calcule ta cote R, planifie la cote à viser et compare les universités selon ce qui compte pour toi.",
      retour: { href: "#/", label: "Accueil" },
      contenu: `
      ${r ? `<div class="panel stat"><span class="muted small">Ta cote R enregistrée</span><strong>${fmt(r.cote, 3)}</strong><span class="muted small">sur ${fmt(r.unites, 2)} unités</span></div>` : ""}
      <div class="cards">
        ${carte("#/cegep/cote-r", "🧮", "Calculateur de cote R", "Entre tes notes, la moyenne et l'écart-type de chaque groupe : ta cote R se calcule cours par cours.")}
        ${carte("#/cegep/prevision", "🎯", "Prévision de cote R", "Quelle cote R viser dans tes prochains cours pour atteindre ton objectif ?")}
        ${carte("#/cegep/interets", "🧭", "Test d'intérêts universitaire", "30 questions pour trouver les baccalauréats qui te correspondent.")}
        ${carte("#/cegep/admissibilite", "📊", "Avec ma cote R, où puis-je aller ?", "Tableau qui se met à jour selon ta cote R : programmes et universités à ta portée.")}
        ${carte("#/cegep/classement", "🏆", "Classement des universités", "Classe les universités selon tes critères : bourses, parcours, DEC-BAC, études à l'étranger, ville.")}
      </div>`,
    });
  }
  const carte = (href, ico, t, p) => `<a class="card" href="${href}"><span class="card-ico" aria-hidden="true">${ico}</span><h2>${t}</h2><p>${p}</p></a>`;

  /* ---------- Calculateur de cote R ---------- */
  const LIGNE_VIDE = () => ({ cours: "", unites: "2", note: "", moy: "", ecart: "", ifgz: "0", idgz: "1", session: "1", coteSaisie: "" });

  function coteCours(l) {
    const saisie = num(l.coteSaisie);
    if (saisie != null) return saisie;
    const note = num(l.note), moy = num(l.moy), sd = num(l.ecart);
    if (note == null || moy == null || !sd) return null;
    const z = (note - moy) / sd;
    const ifgz = num(l.ifgz) ?? 0, idgz = num(l.idgz) ?? 1;
    return (z * idgz + ifgz + 5) * 5;
  }
  function poids(l) {
    const u = num(l.unites) || 0;
    const note = num(l.note);
    if (note != null && note < 60) return u * (l.session === "1" ? POIDS_ECHEC_S1 : POIDS_ECHEC);
    return u;
  }

  function coteR(app) {
    let lignes = store.get("lignesCoteR", null) || [LIGNE_VIDE(), LIGNE_VIDE(), LIGNE_VIDE(), LIGNE_VIDE()];
    let avance = store.get("coteR:avance", false);

    app.innerHTML = page({
      titre: "Calculateur de cote R",
      intro: "Pour chaque cours, inscris ta note, la moyenne et l'écart-type du groupe (dans Omnivox ou ton bulletin). Si tu connais déjà la cote R d'un cours, inscris-la directement.",
      retour: RET,
      contenu: `
      <div class="formula">
        <p><strong>Formule :</strong> cote R = (Z × IDGZ + IFGZ + 5) × 5, où Z = (ta note − moyenne du groupe) ÷ écart-type.</p>
        <p class="small muted">IFGZ (force du groupe) et IDGZ (dispersion du groupe) proviennent des résultats au secondaire des élèves du groupe. Sans ces valeurs, on suppose un groupe moyen (IFGZ = 0, IDGZ = 1). Les échecs comptent pour ${fmt(POIDS_ECHEC_S1, 2)} à la 1re session et ${fmt(POIDS_ECHEC, 1)} ensuite.</p>
        <label class="check"><input type="checkbox" id="avance" ${avance ? "checked" : ""}> Afficher IFGZ et IDGZ</label>
      </div>
      <div class="table-wrap"><table class="tbl calc" id="calc"></table></div>
      <div class="row-actions">
        <button class="btn ghost" id="ajout">+ Ajouter un cours</button>
        <button class="btn ghost danger" id="vider">Tout effacer</button>
      </div>
      <div class="panel total" id="total"></div>`,
    });

    const tbl = app.querySelector("#calc");
    const total = app.querySelector("#total");

    function rendreTable() {
      tbl.innerHTML = `
        <thead><tr>
          <th>Cours</th><th>Unités</th><th>Ta note</th><th>Moyenne groupe</th><th>Écart-type</th>
          ${avance ? "<th>IFGZ</th><th>IDGZ</th>" : ""}
          <th>Session</th><th>Cote R connue</th><th>Cote R</th><th></th>
        </tr></thead>
        <tbody>${lignes.map((l, i) => `
          <tr data-i="${i}">
            <td><input data-k="cours" value="${esc(l.cours)}" placeholder="Ex. : Chimie générale" aria-label="Nom du cours"></td>
            <td><input data-k="unites" value="${esc(l.unites)}" inputmode="decimal" class="w-xs" aria-label="Unités"></td>
            <td><input data-k="note" value="${esc(l.note)}" inputmode="decimal" class="w-xs" aria-label="Ta note"></td>
            <td><input data-k="moy" value="${esc(l.moy)}" inputmode="decimal" class="w-xs" aria-label="Moyenne du groupe"></td>
            <td><input data-k="ecart" value="${esc(l.ecart)}" inputmode="decimal" class="w-xs" aria-label="Écart-type"></td>
            ${avance ? `<td><input data-k="ifgz" value="${esc(l.ifgz)}" inputmode="decimal" class="w-xs" aria-label="IFGZ"></td>
                        <td><input data-k="idgz" value="${esc(l.idgz)}" inputmode="decimal" class="w-xs" aria-label="IDGZ"></td>` : ""}
            <td><select data-k="session" aria-label="Session">${[1, 2, 3, 4, 5, 6].map((s) => `<option ${String(s) === l.session ? "selected" : ""}>${s}</option>`).join("")}</select></td>
            <td><input data-k="coteSaisie" value="${esc(l.coteSaisie)}" inputmode="decimal" class="w-xs" placeholder="—" aria-label="Cote R connue"></td>
            <td class="cote" data-cote="${i}"></td>
            <td><button class="icon" data-del="${i}" aria-label="Retirer ce cours">✕</button></td>
          </tr>`).join("")}</tbody>`;
      calculer();
    }

    function calculer() {
      let s = 0, w = 0, unites = 0, n = 0;
      lignes.forEach((l, i) => {
        const r = coteCours(l);
        const cell = tbl.querySelector(`[data-cote="${i}"]`);
        const echec = num(l.note) != null && num(l.note) < 60;
        if (cell) cell.innerHTML = r == null ? '<span class="muted">—</span>' : `<b>${fmt(r, 2)}</b>${echec ? ' <span class="badge ko">échec</span>' : ""}`;
        if (r == null) return;
        const p = poids(l);
        s += r * p; w += p; unites += num(l.unites) || 0; n++;
      });
      const cote = w ? s / w : null;
      total.innerHTML = cote == null
        ? `<p class="muted">Remplis au moins un cours pour voir ta cote R globale.</p>`
        : `<div class="stat"><span class="muted small">Cote R globale</span><strong>${fmt(cote, 3)}</strong>
           <span class="muted small">${n} cours · ${fmt(unites, 2)} unités</span></div>
           <p>${interpretation(cote)}</p>
           <div class="row-actions"><a class="btn" href="#/cegep/admissibilite">Voir où je peux aller</a>
           <a class="btn ghost" href="#/cegep/prevision">Prévoir ma cote finale</a></div>`;
      if (cote != null) store.set("coteR", { cote, unites });
      store.set("lignesCoteR", lignes);
    }

    tbl.oninput = (e) => {
      const tr = e.target.closest("tr[data-i]"); const k = e.target.dataset.k;
      if (!tr || !k) return;
      lignes[tr.dataset.i][k] = e.target.value;
      calculer();
    };
    tbl.onchange = tbl.oninput;
    tbl.onclick = (e) => {
      const d = e.target.dataset.del;
      if (d == null) return;
      lignes.splice(Number(d), 1);
      if (!lignes.length) lignes.push(LIGNE_VIDE());
      rendreTable();
    };
    app.querySelector("#ajout").onclick = () => { lignes.push(LIGNE_VIDE()); rendreTable(); tbl.querySelector("tbody tr:last-child input").focus(); };
    app.querySelector("#vider").onclick = () => {
      if (!confirm("Effacer tous les cours ?")) return;
      lignes = [LIGNE_VIDE()]; store.del("coteR"); rendreTable();
    };
    app.querySelector("#avance").onchange = (e) => { avance = e.target.checked; store.set("coteR:avance", avance); rendreTable(); };
    rendreTable();
  }

  function interpretation(r) {
    if (r >= 34) return "Excellente cote : la plupart des programmes, y compris les plus contingentés (médecine, médecine dentaire), sont envisageables.";
    if (r >= 31) return "Très bonne cote : physiothérapie, droit, psychologie et pharmacie sont à ta portée selon l'université.";
    if (r >= 28) return "Bonne cote : la majorité des programmes contingentés hors santé spécialisée te sont accessibles.";
    if (r >= 25) return "Cote dans la moyenne (25 = groupe moyen) : de nombreux programmes, surtout non contingentés.";
    return "Cote sous la moyenne : vise les programmes non contingentés, un DEC-BAC ou remonte ta cote dans les prochaines sessions.";
  }

  /* ---------- Prévision ---------- */
  function prevision(app) {
    const sauve = store.get("coteR", null);
    const p = store.get("prevision", { actuelle: sauve ? sauve.cote.toFixed(2) : "", faites: sauve ? String(sauve.unites) : "", total: "58", cible: "30", moy: "75", ecart: "10", ifgz: "0", idgz: "1" });
    if (sauve && !p.actuelle) { p.actuelle = sauve.cote.toFixed(2); p.faites = String(sauve.unites); }

    const options = CE.BACS.flatMap((b) => b.offres.filter((o) => o.cote != null).map((o) => ({ v: o.cote, t: `${b.nom} — ${uni(o.u).court} (${fmt(o.cote, 1)})` })))
      .sort((a, b) => b.v - a.v);

    app.innerHTML = page({
      titre: "Prévision de cote R",
      intro: "Indique où tu en es et la cote que tu vises : on calcule la cote R moyenne à obtenir dans tes cours restants et la note que ça représente.",
      retour: RET,
      contenu: `
      <div class="grid2">
        <div class="panel">
          <h2 class="h3">Ta situation</h2>
          <div class="form">
            <label>Cote R actuelle <input id="actuelle" inputmode="decimal" value="${esc(p.actuelle)}" placeholder="Ex. : 28,5"></label>
            <label>Unités déjà complétées <input id="faites" inputmode="decimal" value="${esc(p.faites)}" placeholder="Ex. : 26"></label>
            <label>Unités totales du DEC <input id="total" inputmode="decimal" value="${esc(p.total)}">
              <span class="hint">Environ 56 à 60 en préuniversitaire, 87 à 95 en technique.</span></label>
          </div>
        </div>
        <div class="panel">
          <h2 class="h3">Ton objectif</h2>
          <div class="form">
            <label>Programme visé (facultatif)
              <select id="choix"><option value="">— Choisir pour remplir la cible —</option>${options.map((o) => `<option value="${o.v}">${esc(o.t)}</option>`).join("")}</select></label>
            <label>Cote R visée <input id="cible" inputmode="decimal" value="${esc(p.cible)}"></label>
          </div>
          <details><summary>Paramètres de tes groupes (pour convertir en note)</summary>
            <div class="form cols">
              <label>Moyenne typique <input id="moy" inputmode="decimal" value="${esc(p.moy)}"></label>
              <label>Écart-type typique <input id="ecart" inputmode="decimal" value="${esc(p.ecart)}"></label>
              <label>IFGZ <input id="ifgz" inputmode="decimal" value="${esc(p.ifgz)}"></label>
              <label>IDGZ <input id="idgz" inputmode="decimal" value="${esc(p.idgz)}"></label>
            </div>
          </details>
        </div>
      </div>
      <div id="res"></div>`,
    });

    const champs = ["actuelle", "faites", "total", "cible", "moy", "ecart", "ifgz", "idgz"];
    const res = app.querySelector("#res");

    function calculer() {
      champs.forEach((k) => (p[k] = app.querySelector("#" + k).value));
      store.set("prevision", p);
      const a = num(p.actuelle), f = num(p.faites) ?? 0, t = num(p.total), c = num(p.cible);
      if (t == null || c == null || (f > 0 && a == null)) { res.innerHTML = `<p class="muted">Remplis ta cote actuelle, les unités et la cible.</p>`; return; }
      const reste = t - f;
      if (reste <= 0) { res.innerHTML = `<p class="panel">Ton DEC est complété : ta cote finale est ${fmt(a, 2)}.</p>`; return; }
      const requise = (c * t - (a || 0) * f) / reste;
      const moy = num(p.moy) ?? 75, sd = num(p.ecart) ?? 10, ifgz = num(p.ifgz) ?? 0, idgz = num(p.idgz) || 1;
      const z = (requise / 5 - 5 - ifgz) / idgz;
      const note = moy + z * sd;
      let niveau, cls;
      if (requise <= (a || 25)) { niveau = "Tu es sur la bonne voie : garde ton rythme actuel."; cls = "ok"; }
      else if (requise <= 33) { niveau = "Atteignable avec un effort soutenu."; cls = "mid"; }
      else if (requise <= 37) { niveau = "Très exigeant : il faudra être parmi les meilleurs de chaque groupe."; cls = "warn"; }
      else { niveau = "Pratiquement hors d'atteinte avec les unités restantes. Pense à un plan B ou à prolonger ton parcours."; cls = "ko"; }

      const scen = [24, 26, 28, 30, 32, 34, 36].map((x) => ({ x, fin: ((a || 0) * f + x * reste) / t }));
      res.innerHTML = `
        <div class="panel total ${cls}">
          <div class="stat"><span class="muted small">Cote R moyenne à obtenir sur ${fmt(reste, 2)} unités restantes</span>
            <strong>${fmt(requise, 2)}</strong></div>
          <div class="stat"><span class="muted small">Soit une note moyenne d'environ</span>
            <strong>${note > 100 ? "> 100 %" : fmt(Math.max(note, 0), 0) + " %"}</strong>
            <span class="muted small">dans un groupe à ${fmt(moy, 0)} % de moyenne (écart-type ${fmt(sd, 0)})</span></div>
          <p>${niveau}</p>
        </div>
        <h2>Si tu obtiens en moyenne…</h2>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Cote R dans les cours restants</th><th>Cote R finale</th><th>Objectif ${fmt(c, 1)}</th></tr></thead>
          <tbody>${scen.map((s) => `<tr><td>${s.x}</td><td><b>${fmt(s.fin, 2)}</b></td><td>${s.fin >= c ? '<span class="badge ok">Atteint</span>' : '<span class="badge ko">Non</span>'}</td></tr>`).join("")}</tbody>
        </table></div>`;
    }

    app.querySelector("#choix").onchange = (e) => { if (e.target.value) { app.querySelector("#cible").value = e.target.value; calculer(); } };
    champs.forEach((k) => (app.querySelector("#" + k).oninput = debounce(calculer, 80)));
    calculer();
  }

  /* ---------- Test d'intérêts universitaire ---------- */
  function interets(app) {
    const cle = "uni-interets";
    app.innerHTML = page({
      titre: "Test d'intérêts universitaire",
      intro: "Indique à quel point chaque domaine d'études ou de travail t'attire. Tes résultats sont reliés aux baccalauréats et aux cotes R.",
      retour: RET,
      contenu: `<div id="zone"></div>`,
    });
    const zone = app.querySelector("#zone");
    const montrer = (rep) => {
      const profil = TESTS.scores(CE.TEST_INTERETS_UNI, rep, Object.keys(CE.RIASEC));
      store.set("profil-riasec-uni", profil);
      const code = TESTS.codeHolland(profil);
      const libs = Object.fromEntries(Object.entries(CE.RIASEC).map(([k, v]) => [k, v.nom]));
      const maCote = (store.get("coteR", null) || {}).cote;
      const progs = CE.BACS.map((b) => ({ b, s: TESTS.adequation(b.riasec, profil) })).sort((x, y) => y.s - x.s).slice(0, 8);
      zone.innerHTML = `
        <div class="result">
          <div class="result-head">
            <div><p class="muted small">Ton code d'intérêts</p><p class="code">${code}</p></div>
            <button class="btn ghost" id="refaire">Refaire le test</button>
          </div>
          ${TESTS.barres(profil, libs)}
          <div class="types">${[...code].map((l) => `<div class="type"><h3>${l} · ${CE.RIASEC[l].nom}</h3><p>${CE.RIASEC[l].desc}</p></div>`).join("")}</div>
        </div>
        <h2>Baccalauréats qui te ressemblent</h2>
        <div class="prog-list">${progs.map(({ b, s }) => {
          const cotes = b.offres.filter((o) => o.cote != null).map((o) => o.cote);
          const min = cotes.length ? Math.min(...cotes) : null;
          return `<article class="prog">
            <div class="prog-top"><span class="tag">${esc(CE.DOMAINES[b.domaine])}</span><span class="match">${s} %</span></div>
            <h3>${esc(b.nom)}</h3>
            <p class="small"><strong>DEC habituels :</strong> ${b.dec.map((c) => esc(dec(c) ? dec(c).nom : c)).join(", ")}</p>
            <p class="small"><strong>Universités :</strong> ${b.offres.map((o) => uni(o.u).court).join(", ")}</p>
            <p class="small"><strong>Cote R :</strong> ${min == null ? "pas de cote publiée (non contingenté ou dossier)" : `à partir d'environ ${fmt(min, 1)}`}
              ${maCote && min != null ? (maCote >= min ? ' <span class="badge ok">à ta portée</span>' : ' <span class="badge ko">au-dessus de ta cote</span>') : ""}</p>
            <a class="small" href="#/cegep/admissibilite?bac=${b.id}">Voir les universités →</a>
          </article>`;
        }).join("")}</div>`;
      zone.querySelector("#refaire").onclick = () => { store.del(cle + ":rep"); store.del(cle + ":fini"); interets(app); };
    };
    if (store.get(cle + ":fini", false)) montrer(store.get(cle + ":rep", {}));
    else TESTS.questionnaire(zone, { cle, questions: CE.TEST_INTERETS_UNI, echelle: CE.ECHELLE_INTERET, onFini: montrer });
  }

  /* ---------- Admissibilité selon la cote R ---------- */
  const MARGE = 0.5;
  function statut(maCote, cote) {
    if (cote == null) return { k: 3, cls: "info", t: "Sans cote publiée" };
    if (maCote >= cote + MARGE) return { k: 0, cls: "ok", t: "Admission probable" };
    if (maCote >= cote - MARGE) return { k: 1, cls: "mid", t: "À la limite" };
    return { k: 2, cls: "ko", t: "Hors d'atteinte" };
  }

  function admissibilite(app, params) {
    const sauve = store.get("coteR", null);
    const f = Object.assign({ cote: sauve ? sauve.cote.toFixed(1) : "28", dec: "", domaine: "", ville: "", langue: "", bac: "", seulement: false, tri: "ecart", sens: -1 },
      store.get("admiss", {}));
    if (params.get("bac")) { f.bac = params.get("bac"); f.domaine = ""; }

    app.innerHTML = page({
      titre: "Avec ma cote R, où puis-je aller ?",
      intro: `Le tableau se met à jour dès que tu changes ta cote R ou un filtre. Les cotes affichées sont celles de la dernière personne admise (estimations, mise à jour ${esc(CE.COTES_MAJ)}).`,
      retour: RET,
      contenu: `
      <div class="panel cote-input">
        <label for="cote">Ma cote R</label>
        <input type="range" id="slider" min="20" max="38" step="0.1" value="${esc(num(f.cote) ?? 28)}">
        <input id="cote" inputmode="decimal" value="${esc(f.cote)}" class="w-sm">
        ${sauve ? `<button class="btn ghost small" id="reprendre">Reprendre ma cote calculée (${fmt(sauve.cote, 2)})</button>` : ""}
      </div>
      <div class="filters">
        <label>Mon DEC <select id="dec"><option value="">Tous</option>${CE.DEC.filter((p) => p.type !== "tremplin").map((p) => `<option value="${p.code}" ${p.code === f.dec ? "selected" : ""}>${esc(p.nom)}</option>`).join("")}</select></label>
        <label>Domaine <select id="domaine"><option value="">Tous</option>${Object.entries(CE.DOMAINES).map(([k, v]) => `<option value="${k}" ${k === f.domaine ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label>Programme <select id="bac"><option value="">Tous</option>${CE.BACS.map((b) => `<option value="${b.id}" ${b.id === f.bac ? "selected" : ""}>${esc(b.nom)}</option>`).join("")}</select></label>
        <label>Ville <select id="ville"><option value="">Toutes</option>${CE.VILLES.map((v) => `<option ${v === f.ville ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
        <label>Langue <select id="langue"><option value="">Toutes</option><option value="fr" ${f.langue === "fr" ? "selected" : ""}>Français</option><option value="en" ${f.langue === "en" ? "selected" : ""}>Anglais</option></select></label>
        <label class="check"><input type="checkbox" id="seulement" ${f.seulement ? "checked" : ""}> Seulement ce qui m'est accessible</label>
      </div>
      <div class="summary" id="resume"></div>
      <div class="table-wrap"><table class="tbl sortable" id="tab"></table></div>
      <p class="muted small">« Admission probable » : ta cote dépasse d'au moins ${fmt(MARGE, 1)} la dernière cote admise. Les programmes « sans cote publiée » admettent selon le DEC, les préalables, un dossier ou une audition. Plusieurs programmes de santé ajoutent un test (CASPer) ou des entrevues.</p>`,
    });

    const tab = app.querySelector("#tab");
    const resume = app.querySelector("#resume");

    function lignes() {
      const maCote = num(f.cote) ?? 0;
      const out = [];
      CE.BACS.forEach((b) => {
        if (f.domaine && b.domaine !== f.domaine) return;
        if (f.bac && b.id !== f.bac) return;
        b.offres.forEach((o) => {
          const u = uni(o.u);
          if (f.ville && u.ville !== f.ville) return;
          if (f.langue && u.langue !== f.langue) return;
          const st = statut(maCote, o.cote);
          if (f.seulement && st.k === 2) return;
          out.push({ b, o, u, st, ecart: o.cote == null ? null : maCote - o.cote, decOk: !f.dec || b.dec.includes(f.dec) });
        });
      });
      const cmp = {
        prog: (x, y) => x.b.nom.localeCompare(y.b.nom, "fr"),
        uni: (x, y) => x.u.court.localeCompare(y.u.court, "fr"),
        ville: (x, y) => x.u.ville.localeCompare(y.u.ville, "fr"),
        cote: (x, y) => (x.o.cote ?? -1) - (y.o.cote ?? -1),
        ecart: (x, y) => (x.ecart ?? 99) - (y.ecart ?? 99),
        statut: (x, y) => x.st.k - y.st.k,
      }[f.tri];
      // Les programmes sans cote publiée restent en bas, quel que soit le sens du tri par cote ou par écart.
      const sansCote = (r) => (f.tri === "cote" || f.tri === "ecart") && r.o.cote == null;
      out.sort((x, y) => (sansCote(x) - sansCote(y)) || f.sens * cmp(x, y) || x.b.nom.localeCompare(y.b.nom, "fr"));
      return out;
    }

    function rendre() {
      store.set("admiss", Object.assign({}, f, { bac: f.bac }));
      const rows = lignes();
      const n = (k) => rows.filter((r) => r.st.k === k).length;
      resume.innerHTML = `
        <span class="pill ok">${n(0)} admission probable</span>
        <span class="pill mid">${n(1)} à la limite</span>
        <span class="pill ko">${n(2)} hors d'atteinte</span>
        <span class="pill info">${n(3)} sans cote publiée</span>`;
      const th = (k, t) => `<th data-tri="${k}" class="${f.tri === k ? (f.sens > 0 ? "asc" : "desc") : ""}" tabindex="0" role="button">${t}</th>`;
      tab.innerHTML = `
        <thead><tr>${th("prog", "Programme")}${th("uni", "Université")}${th("ville", "Ville")}${th("cote", "Dernière cote admise")}${th("ecart", "Ton écart")}${th("statut", "Statut")}</tr></thead>
        <tbody>${rows.length ? rows.map((r) => `
          <tr class="st-${r.st.cls}">
            <td><b>${esc(r.b.nom)}</b>${r.o.note ? `<br><span class="muted small">${esc(r.o.note)}</span>` : ""}
              ${!r.decOk ? `<br><span class="badge warn" title="Préalables : ${esc(r.b.preal)}">Vérifie les préalables avec ton DEC</span>` : ""}</td>
            <td><a href="${r.u.site}" target="_blank" rel="noopener">${esc(r.u.court)}</a></td>
            <td>${esc(r.u.ville)}</td>
            <td>${r.o.cote == null ? '<span class="muted">—</span>' : fmt(r.o.cote, 1)}</td>
            <td>${r.ecart == null ? '<span class="muted">—</span>' : `<span class="${r.ecart >= 0 ? "pos" : "neg"}">${r.ecart >= 0 ? "+" : ""}${fmt(r.ecart, 1)}</span>`}</td>
            <td><span class="badge ${r.st.cls}">${r.st.t}</span></td>
          </tr>`).join("") : `<tr><td colspan="6" class="muted">Aucun résultat avec ces filtres.</td></tr>`}</tbody>`;
    }

    const slider = app.querySelector("#slider"), champ = app.querySelector("#cote");
    slider.oninput = () => { f.cote = slider.value; champ.value = String(slider.value).replace(".", ","); rendre(); };
    champ.oninput = debounce(() => { f.cote = champ.value; if (num(champ.value) != null) slider.value = num(champ.value); rendre(); }, 100);
    const rep = app.querySelector("#reprendre");
    if (rep) rep.onclick = () => { f.cote = sauve.cote.toFixed(2); champ.value = f.cote.replace(".", ","); slider.value = sauve.cote; rendre(); };
    ["dec", "domaine", "ville", "langue", "bac"].forEach((k) => (app.querySelector("#" + k).onchange = (e) => { f[k] = e.target.value; rendre(); }));
    app.querySelector("#seulement").onchange = (e) => { f.seulement = e.target.checked; rendre(); };
    const trier = (e) => {
      const k = e.target.closest("[data-tri]"); if (!k) return;
      if (f.tri === k.dataset.tri) f.sens = -f.sens; else { f.tri = k.dataset.tri; f.sens = k.dataset.tri === "ecart" || k.dataset.tri === "cote" ? -1 : 1; }
      rendre();
    };
    tab.onclick = trier;
    tab.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trier(e); } };
    rendre();
  }

  /* ---------- Classement des universités ---------- */
  const CRITERES = [
    { k: "bourses", t: "Bourses", d: "Bourses d'admission et d'excellence" },
    { k: "parcours", t: "Parcours", d: "Variété des programmes, régime coop, stages, flexibilité" },
    { k: "decbac", t: "Chemin DEC-BAC", d: "Ententes et reconnaissance de crédits pour les DEC techniques" },
    { k: "etranger", t: "Études à l'étranger", d: "Échanges, doubles diplômes, sessions internationales" },
    { k: "ville", t: "Ville", d: "Correspondance avec les villes que tu préfères" },
  ];

  function classement(app) {
    const st = Object.assign({ poids: { bourses: 3, parcours: 3, decbac: 2, etranger: 2, ville: 3 }, villes: [], langue: "", bac: "" }, store.get("classement", {}));
    const maCote = (store.get("coteR", null) || {}).cote;

    app.innerHTML = page({
      titre: "Classement des universités",
      intro: "Donne de l'importance (0 à 5) à chaque critère : le classement se recalcule instantanément. Les appréciations sont indicatives et basées sur l'offre publiée par chaque université.",
      retour: RET,
      contenu: `
      <div class="grid2">
        <div class="panel">
          <h2 class="h3">Importance des critères</h2>
          ${CRITERES.map((c) => `
            <div class="slider-row">
              <label for="w-${c.k}"><b>${c.t}</b><span class="hint">${c.d}</span></label>
              <input type="range" id="w-${c.k}" data-k="${c.k}" min="0" max="5" step="1" value="${st.poids[c.k]}">
              <output id="o-${c.k}">${st.poids[c.k]}</output>
            </div>`).join("")}
        </div>
        <div class="panel">
          <h2 class="h3">Mes préférences</h2>
          <p class="small"><b>Villes souhaitées</b> (aucune = sans préférence)</p>
          <div class="chips" id="villes">${CE.VILLES.map((v) => `<button class="chip ${st.villes.includes(v) ? "on" : ""}" data-v="${esc(v)}" aria-pressed="${st.villes.includes(v)}">${esc(v)}</button>`).join("")}</div>
          <div class="form">
            <label>Langue d'enseignement <select id="langue"><option value="">Peu importe</option><option value="fr" ${st.langue === "fr" ? "selected" : ""}>Français</option><option value="en" ${st.langue === "en" ? "selected" : ""}>Anglais</option></select></label>
            <label>Programme visé <select id="bac"><option value="">Tous</option>${CE.BACS.map((b) => `<option value="${b.id}" ${b.id === st.bac ? "selected" : ""}>${esc(b.nom)}</option>`).join("")}</select>
              <span class="hint">Seules les universités qui offrent ce programme sont classées.</span></label>
          </div>
        </div>
      </div>
      <div id="rang" class="ranking"></div>`,
    });

    const rang = app.querySelector("#rang");

    function scoreVille(u) {
      if (!st.villes.length) return 3;
      return st.villes.includes(u.ville) ? 5 : 1;
    }

    function rendre() {
      store.set("classement", st);
      const b = st.bac ? bac(st.bac) : null;
      const total = CRITERES.reduce((s, c) => s + st.poids[c.k], 0) || 1;
      const liste = CE.UNIVERSITES
        .filter((u) => !st.langue || u.langue === st.langue)
        .filter((u) => !b || b.offres.some((o) => o.u === u.id))
        .map((u) => {
          const sc = Object.assign({}, u.scores, { ville: scoreVille(u) });
          const s = CRITERES.reduce((acc, c) => acc + sc[c.k] * st.poids[c.k], 0) / total;
          const offre = b ? b.offres.find((o) => o.u === u.id) : null;
          return { u, sc, s: Math.round((s / 5) * 100), offre };
        })
        .sort((x, y) => y.s - x.s || x.u.nom.localeCompare(y.u.nom, "fr"));

      rang.innerHTML = liste.length ? liste.map((r, i) => `
        <details class="rank">
          <summary>
            <span class="pos">${i + 1}</span>
            <span class="rank-name"><b>${esc(r.u.nom)}</b><span class="muted small">${esc(r.u.ville)} · ${r.u.langue === "fr" ? "français" : "anglais"} · coût de la vie ${esc(CE.COUT_VIE[r.u.ville])}</span>
              ${r.offre ? `<span class="small">${esc(b.nom)} : ${r.offre.cote == null ? "pas de cote publiée" : `cote ≈ ${fmt(r.offre.cote, 1)}`}
                ${maCote && r.offre.cote != null ? `<span class="badge ${statut(maCote, r.offre.cote).cls}">${statut(maCote, r.offre.cote).t}</span>` : ""}</span>` : ""}
            </span>
            <span class="rank-bars">${CRITERES.map((c) => `<span class="mini" title="${c.t} : ${r.sc[c.k]}/5"><span style="height:${r.sc[c.k] * 20}%"></span></span>`).join("")}</span>
            <span class="score"><b>${r.s}</b><span class="muted small">/100</span></span>
          </summary>
          <div class="rank-body">
            <ul>${CRITERES.map((c) => `<li><b>${c.t} (${r.sc[c.k]}/5)</b> : ${c.k === "ville"
              ? (st.villes.length ? (st.villes.includes(r.u.ville) ? "dans une ville que tu as choisie." : "hors de tes villes préférées.") : "aucune préférence indiquée.")
              : esc(r.u.notes[c.k])}</li>`).join("")}</ul>
            <a href="${r.u.site}" target="_blank" rel="noopener">Site de l'admission →</a>
          </div>
        </details>`).join("") : `<p class="muted">Aucune université ne correspond à ces filtres.</p>`;
    }

    app.querySelectorAll('input[type="range"]').forEach((r) => r.oninput = () => {
      st.poids[r.dataset.k] = Number(r.value);
      app.querySelector("#o-" + r.dataset.k).textContent = r.value;
      rendre();
    });
    app.querySelector("#villes").onclick = (e) => {
      const v = e.target.dataset.v; if (!v) return;
      st.villes = st.villes.includes(v) ? st.villes.filter((x) => x !== v) : [...st.villes, v];
      e.target.classList.toggle("on"); e.target.setAttribute("aria-pressed", st.villes.includes(v));
      rendre();
    };
    app.querySelector("#langue").onchange = (e) => { st.langue = e.target.value; rendre(); };
    app.querySelector("#bac").onchange = (e) => { st.bac = e.target.value; rendre(); };
    rendre();
  }

  window.CEGEP = { accueil, coteR, prevision, interets, admissibilite, classement, _coteCours: coteCours };
})();
