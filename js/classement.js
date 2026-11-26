/* Classement des universités selon des critères pondérés par l'élève. */
(function () {
  const { esc, store, page, fmt, bac } = UI;

  const GROUPES = [
    { t: "Études", c: [
      { k: "parcours", t: "Parcours", d: "Variété des programmes et flexibilité" },
      { k: "stages", t: "Stages et coop", d: "Stages rémunérés, régime coopératif" },
      { k: "encadrement", t: "Encadrement", d: "Petites classes, proximité des profs" },
      { k: "recherche", t: "Recherche", d: "Laboratoires, projets de recherche au bac" },
      { k: "decbac", t: "Chemin DEC-BAC", d: "Passerelles pour les DEC techniques" },
      { k: "etranger", t: "Études à l'étranger", d: "Échanges, doubles diplômes" },
    ] },
    { t: "Argent", c: [
      { k: "bourses", t: "Bourses", d: "Bourses d'admission et d'excellence" },
      { k: "cout", t: "Coût de la vie", d: "Loyer et dépenses dans la ville" },
    ] },
    { t: "Milieu de vie", c: [
      { k: "ville", t: "Ville préférée", d: "Dans une des villes que tu choisis" },
      { k: "proximite", t: "Proche de chez moi", d: "Distance de ta ville d'origine" },
      { k: "residences", t: "Résidences", d: "Places en résidence, logement facile" },
      { k: "vie", t: "Vie étudiante", d: "Campus, sports, associations" },
    ] },
  ];
  const CRITERES = GROUPES.flatMap((g) => g.c);
  const DEFAUT = { parcours: 3, stages: 2, encadrement: 2, recherche: 1, decbac: 1, etranger: 2, bourses: 3, cout: 2, ville: 2, proximite: 2, residences: 2, vie: 2 };

  const PROFILS = {
    "Équilibré": DEFAUT,
    "Petit budget": { parcours: 2, stages: 3, encadrement: 1, recherche: 0, decbac: 1, etranger: 0, bourses: 5, cout: 5, ville: 0, proximite: 4, residences: 4, vie: 1 },
    "Rester près de chez moi": { parcours: 2, stages: 1, encadrement: 2, recherche: 0, decbac: 1, etranger: 0, bourses: 2, cout: 2, ville: 0, proximite: 5, residences: 1, vie: 1 },
    "Carrière et stages": { parcours: 4, stages: 5, encadrement: 2, recherche: 2, decbac: 2, etranger: 1, bourses: 2, cout: 1, ville: 1, proximite: 1, residences: 1, vie: 1 },
    "Aventure et international": { parcours: 3, stages: 1, encadrement: 1, recherche: 2, decbac: 0, etranger: 5, bourses: 2, cout: 0, ville: 2, proximite: 0, residences: 3, vie: 5 },
    "Future chercheuse ou chercheur": { parcours: 4, stages: 2, encadrement: 3, recherche: 5, decbac: 0, etranger: 3, bourses: 3, cout: 0, ville: 0, proximite: 0, residences: 1, vie: 1 },
  };

  const LIEUX = Object.keys(CE.LIEUX).sort((a, b) => a.localeCompare(b, "fr"));

  function scoreProximite(km) {
    if (km == null) return 3;
    if (km <= 50) return 5;
    if (km <= 150) return 4;
    if (km <= 300) return 3;
    if (km <= 500) return 2;
    return 1;
  }

  function classement(app) {
    const st = Object.assign({ villes: [], langue: "", bac: "" }, store.get("classement", {}));
    st.poids = Object.assign({}, DEFAUT, st.poids || {});
    st.origine = store.get("origine", st.origine || "");
    const maCote = (store.get("coteR", null) || {}).cote;

    app.innerHTML = page({
      titre: "Classement des universités",
      intro: "Donne de l'importance (0 à 5) à chaque critère ou pars d'un profil : le classement se recalcule instantanément. Ouvre une université pour voir sa fiche complète. Les appréciations sont indicatives et basées sur l'offre publiée.",
      retour: { href: "#/cegep", label: "Cégep" },
      contenu: `
      <div class="chips" id="profils" aria-label="Profils prédéfinis">
        <span class="muted small">Partir d'un profil :</span>
        ${Object.keys(PROFILS).map((p) => `<button class="chip" data-p="${esc(p)}">${esc(p)}</button>`).join("")}
      </div>
      <div class="crit-groups">
        ${GROUPES.map((g) => `
          <div class="panel">
            <h2 class="h3">${g.t}</h2>
            ${g.c.map((c) => `
              <div class="slider-row">
                <label for="w-${c.k}"><b>${c.t}</b><span class="hint">${c.d}</span></label>
                <input type="range" id="w-${c.k}" data-k="${c.k}" min="0" max="5" step="1" value="${st.poids[c.k]}">
                <output id="o-${c.k}">${st.poids[c.k]}</output>
              </div>`).join("")}
          </div>`).join("")}
      </div>
      <div class="panel">
        <h2 class="h3">Mes préférences</h2>
        <div class="filters">
          <label>Ma ville d'origine
            <select id="origine"><option value="">— Choisir —</option>${LIEUX.map((l) => `<option ${l === st.origine ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
          <label>Langue d'enseignement <select id="langue"><option value="">Peu importe</option><option value="fr" ${st.langue === "fr" ? "selected" : ""}>Français</option><option value="en" ${st.langue === "en" ? "selected" : ""}>Anglais</option></select></label>
          <label>Programme visé <select id="bac"><option value="">Tous</option>${CE.BACS.map((b) => `<option value="${b.id}" ${b.id === st.bac ? "selected" : ""}>${esc(b.nom)}</option>`).join("")}</select></label>
        </div>
        <p class="small"><b>Villes souhaitées</b> <span class="muted">(aucune = sans préférence)</span></p>
        <div class="chips" id="villes">${CE.VILLES.map((v) => `<button class="chip ${st.villes.includes(v) ? "on" : ""}" data-v="${esc(v)}" aria-pressed="${st.villes.includes(v)}">${esc(v)}</button>`).join("")}</div>
      </div>
      <div id="rang" class="ranking"></div>`,
    });

    const rang = app.querySelector("#rang");

    function scores(u) {
      const f = CE.FICHES[u.id] || { s: {} };
      const km = u.ville === "À distance" ? 0 : (st.origine ? CE.distanceKm(st.origine, u.ville) : null);
      return {
        sc: Object.assign({}, u.scores, f.s, {
          cout: CE.COUT_SCORE[u.ville] || 3,
          ville: st.villes.length ? (st.villes.includes(u.ville) ? 5 : 1) : 3,
          proximite: st.origine ? scoreProximite(km) : 3,
        }),
        km,
      };
    }

    function explication(c, u, sc, km) {
      const f = CE.FICHES[u.id] || {};
      switch (c.k) {
        case "ville": return st.villes.length ? (st.villes.includes(u.ville) ? "dans une ville que tu as choisie." : "hors de tes villes préférées.") : "aucune préférence indiquée.";
        case "proximite": return !st.origine ? "indique ta ville d'origine." : u.ville === "À distance" ? "aucun déplacement." : `environ ${fmt(km, 0)} km de ${esc(st.origine)}.`;
        case "cout": return `coût de la vie ${esc(CE.COUT_VIE[u.ville])} à ${esc(u.ville)}.`;
        case "residences": return esc(f.logement || "");
        case "vie": return esc(f.vie || "");
        case "stages": case "encadrement": case "recherche": return `${sc[c.k]}/5.`;
        default: return esc(u.notes[c.k] || "");
      }
    }

    function rendre() {
      store.set("classement", { poids: st.poids, villes: st.villes, langue: st.langue, bac: st.bac });
      const b = st.bac ? bac(st.bac) : null;
      const total = CRITERES.reduce((s, c) => s + st.poids[c.k], 0) || 1;
      const liste = CE.UNIVERSITES
        .filter((u) => !st.langue || u.langue === st.langue)
        .filter((u) => !b || b.offres.some((o) => o.u === u.id))
        .map((u) => {
          const { sc, km } = scores(u);
          const s = CRITERES.reduce((acc, c) => acc + sc[c.k] * st.poids[c.k], 0) / total;
          return { u, sc, km, s: Math.round((s / 5) * 100), offre: b ? b.offres.find((o) => o.u === u.id) : null };
        })
        .sort((x, y) => y.s - x.s || x.u.nom.localeCompare(y.u.nom, "fr"));

      rang.innerHTML = liste.length ? liste.map((r, i) => {
        const f = CE.FICHES[r.u.id] || {};
        const st2 = r.offre && maCote && r.offre.cote != null ? CEGEP.statut(maCote, r.offre.cote) : null;
        return `
        <details class="rank">
          <summary>
            <span class="pos">${i + 1}</span>
            <span class="rank-name"><b>${esc(r.u.nom)}</b>
              <span class="muted small">${esc(r.u.ville)} · ${r.u.langue === "fr" ? "français" : "anglais"} · coût de la vie ${esc(CE.COUT_VIE[r.u.ville])}${r.km ? ` · ≈ ${fmt(r.km, 0)} km` : ""}</span>
              ${r.offre ? `<span class="small">${esc(b.nom)} : ${r.offre.cote == null ? "pas de cote publiée" : `cote ≈ ${fmt(r.offre.cote, 1)}`}
                ${st2 ? `<span class="badge ${st2.cls}">${st2.t}</span>` : ""}</span>` : ""}
            </span>
            <span class="rank-bars">${CRITERES.map((c) => `<span class="mini" title="${c.t} : ${r.sc[c.k]}/5"><span style="height:${r.sc[c.k] * 20}%"></span></span>`).join("")}</span>
            <span class="score"><b>${r.s}</b><span class="muted small">/100</span></span>
          </summary>
          <div class="rank-body">
            ${ficheHtml(r.u, f)}
            <h4>Pourquoi ce score</h4>
            <ul class="crit-list">${CRITERES.filter((c) => st.poids[c.k] > 0).map((c) =>
              `<li><span class="crit-score">${r.sc[c.k]}/5</span> <b>${c.t}</b> : ${explication(c, r.u, r.sc, r.km)}</li>`).join("")}</ul>
            <div class="row-actions">
              <a class="btn small" href="${r.u.site}" target="_blank" rel="noopener">Site de l'admission</a>
              <a class="btn ghost small" href="#/budget?ville=${encodeURIComponent(r.u.ville)}">Estimer mon budget à ${esc(r.u.ville)}</a>
            </div>
          </div>
        </details>`;
      }).join("") : `<p class="muted">Aucune université ne correspond à ces filtres.</p>`;
    }

    app.querySelectorAll('input[type="range"]').forEach((r) => r.oninput = () => {
      st.poids[r.dataset.k] = Number(r.value);
      app.querySelector("#o-" + r.dataset.k).textContent = r.value;
      rendre();
    });
    app.querySelector("#profils").onclick = (e) => {
      const p = e.target.dataset.p; if (!p) return;
      st.poids = Object.assign({}, PROFILS[p]);
      CRITERES.forEach((c) => { app.querySelector("#w-" + c.k).value = st.poids[c.k]; app.querySelector("#o-" + c.k).textContent = st.poids[c.k]; });
      app.querySelectorAll("#profils .chip").forEach((x) => x.classList.toggle("on", x === e.target));
      rendre();
    };
    app.querySelector("#villes").onclick = (e) => {
      const v = e.target.dataset.v; if (!v) return;
      st.villes = st.villes.includes(v) ? st.villes.filter((x) => x !== v) : [...st.villes, v];
      e.target.classList.toggle("on"); e.target.setAttribute("aria-pressed", st.villes.includes(v));
      rendre();
    };
    app.querySelector("#origine").onchange = (e) => { st.origine = e.target.value; store.set("origine", st.origine); rendre(); };
    app.querySelector("#langue").onchange = (e) => { st.langue = e.target.value; rendre(); };
    app.querySelector("#bac").onchange = (e) => { st.bac = e.target.value; rendre(); };
    rendre();
  }

  /* Fiche d'une université (réutilisée par la recherche). */
  function ficheHtml(u, f) {
    if (!f || !f.taille) return "";
    return `
      <div class="fiche">
        <div><h4>En bref</h4><p>${esc(f.taille)}</p><p class="small"><b>Campus :</b> ${f.campus.map(esc).join(" · ")}</p></div>
        <div><h4>Points forts</h4><div class="tags">${f.forces.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div></div>
        <div><h4>Vie et logement</h4><p class="small">${esc(f.vie)}</p><p class="small">${esc(f.logement)}</p></div>
        <div><h4>Bourses et aides</h4><ul class="small">${f.aides.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>
      </div>`;
  }

  CEGEP.classement = classement;
  window.FICHE = { html: ficheHtml };
})();
