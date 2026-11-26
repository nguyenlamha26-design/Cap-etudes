/* Volet secondaire : intérêts, personnalité, parcours, préalables. */
(function () {
  const { esc, store, page, dec, bac, decCode, cegepsDe, prealablesTexte, manquants, typeLabel } = UI;
  const RET = { href: "#/secondaire", label: "Secondaire" };

  /* ---------- Accueil ---------- */
  function accueil(app) {
    const fini = (k) => store.get(k + ":fini", false);
    app.innerHTML = page({
      titre: "Je termine mon secondaire",
      intro: "Découvre ce qui t'allume, les chemins possibles après le secondaire et les cours à réussir pour entrer au cégep.",
      retour: { href: "#/", label: "Accueil" },
      contenu: `
      <div class="cards">
        ${carte("#/secondaire/interets", "🧭", "Test d'intérêts", "30 questions pour connaître ton profil et les programmes du cégep qui te ressemblent.", fini("sec-interets"))}
        ${carte("#/secondaire/personnalite", "🧩", "Test de personnalité", "20 énoncés sur ta façon d'être et les milieux où tu t'épanouiras.", fini("sec-perso"))}
        ${carte("#/secondaire/parcours", "🗺️", "Parcours possibles", "Préuniversitaire, technique, DEC-BAC, DEP, Tremplin DEC : vois tous les chemins.")}
        ${carte("#/secondaire/prealables", "✅", "Préalables par cégep", "Les cours du secondaire exigés pour chaque programme, dans chaque cégep.")}
        ${carte("#/budget", "💰", "Étudier au cégep loin de chez toi", "Logement, épicerie, retours à la maison : estime ton budget pour une année.")}
        ${carte("#/recherche?type=cegep", "🔎", "Trouver un cégep", "Cherche un cégep par ville, région ou programme.")}
      </div>`,
    });
  }
  function carte(href, ico, titre, txt, fait) {
    return `<a class="card" href="${href}">
      <span class="card-ico" aria-hidden="true">${ico}</span>
      <h2>${titre}</h2><p>${txt}</p>
      ${fait ? `<span class="badge ok">Résultats enregistrés</span>` : ""}
    </a>`;
  }

  /* ---------- Test d'intérêts ---------- */
  function interets(app) {
    const cle = "sec-interets";
    app.innerHTML = page({
      titre: "Test d'intérêts",
      intro: "Indique à quel point chaque activité t'intéresse. Il n'y a pas de bonne réponse : réponds selon tes goûts, pas selon tes notes.",
      retour: RET,
      contenu: `<div id="zone"></div>`,
    });
    const zone = app.querySelector("#zone");
    const montrer = (rep) => resultatInterets(zone, rep, cle);
    if (store.get(cle + ":fini", false)) montrer(store.get(cle + ":rep", {}));
    else TESTS.questionnaire(zone, { cle, questions: CE.TEST_INTERETS_SEC, echelle: CE.ECHELLE_INTERET, onFini: montrer });
  }

  function resultatInterets(zone, rep, cle) {
    const profil = TESTS.scores(CE.TEST_INTERETS_SEC, rep, Object.keys(CE.RIASEC));
    store.set("profil-riasec-sec", profil);
    const code = TESTS.codeHolland(profil);
    const libs = Object.fromEntries(Object.entries(CE.RIASEC).map(([k, v]) => [k, v.nom]));
    const progs = CE.DEC.filter((p) => p.riasec)
      .map((p) => ({ p, s: TESTS.adequation(p.riasec, profil) }))
      .sort((a, b) => b.s - a.s).slice(0, 8);
    zone.innerHTML = `
      <div class="result">
        <div class="result-head">
          <div><p class="muted small">Ton code d'intérêts</p><p class="code">${code}</p></div>
          <button class="btn ghost" id="refaire">Refaire le test</button>
        </div>
        ${TESTS.barres(profil, libs)}
        <div class="types">${[...code].map((l) => `
          <div class="type"><h3>${l} · ${CE.RIASEC[l].nom}</h3><p>${CE.RIASEC[l].desc}</p></div>`).join("")}
        </div>
      </div>
      <h2>Programmes du cégep qui te ressemblent</h2>
      <div class="prog-list">${progs.map(({ p, s }) => progCarte(p, s)).join("")}</div>
      <p class="muted">Astuce : fais aussi le <a href="#/secondaire/personnalite">test de personnalité</a>, puis vérifie les <a href="#/secondaire/prealables">préalables</a> de tes programmes favoris.</p>`;
    zone.querySelector("#refaire").onclick = () => {
      store.del(cle + ":rep"); store.del(cle + ":fini");
      interets(document.getElementById("app"));
    };
  }

  function progCarte(p, s) {
    return `<article class="prog">
      <div class="prog-top">
        <span class="tag ${p.type}">${typeLabel[p.type]}</span>
        ${s != null ? `<span class="match" title="Adéquation avec ton profil">${s} %</span>` : ""}
      </div>
      <h3>${esc(p.nom)} <span class="muted">${decCode(p)}</span></h3>
      <p>${esc(p.resume)}</p>
      <p class="small"><strong>Préalables :</strong> ${prealablesTexte(p).map(esc).join(" · ")}</p>
      <a class="small" href="#/secondaire/prealables?prog=${encodeURIComponent(p.code)}">Où l'étudier →</a>
    </article>`;
  }

  /* ---------- Test de personnalité ---------- */
  function personnalite(app) {
    const cle = "sec-perso";
    app.innerHTML = page({
      titre: "Test de personnalité",
      intro: "Indique à quel point chaque énoncé te décrit. Ce test s'inspire du modèle des cinq grands traits ; il donne des pistes, pas une étiquette.",
      retour: RET,
      contenu: `<div id="zone"></div>`,
    });
    const zone = app.querySelector("#zone");
    const montrer = (rep) => {
      const profil = TESTS.scores(CE.TEST_PERSONNALITE, rep, Object.keys(CE.TRAITS));
      const libs = Object.fromEntries(Object.entries(CE.TRAITS).map(([k, v]) => [k, v.nom]));
      zone.innerHTML = `
        <div class="result">
          <div class="result-head">
            <div><p class="muted small">Ton profil</p></div>
            <button class="btn ghost" id="refaire">Refaire le test</button>
          </div>
          ${TESTS.barres(profil, libs)}
        </div>
        <div class="types">${Object.entries(CE.TRAITS).map(([k, t]) => {
          const v = profil[k];
          const niveau = v >= 60 ? "haut" : v <= 40 ? "bas" : null;
          return `<div class="type">
            <h3>${t.nom} <span class="muted">${v} %</span></h3>
            <p>${niveau ? `Tu sembles plutôt <strong>${niveau === "haut" ? t.haut : t.bas}</strong>.` : `Tu es équilibré : tantôt ${t.haut.split(",")[0]}, tantôt ${t.bas.split(",")[0]}.`}</p>
            ${niveau ? `<p class="small"><strong>Milieux où ça aide :</strong> ${t.env[niveau]}</p>` : ""}
          </div>`;
        }).join("")}</div>
        <p class="muted">Ton tempérament ne t'interdit aucun programme : il t'aide à choisir un milieu où tu te sentiras bien. Combine-le avec ton <a href="#/secondaire/interets">test d'intérêts</a>.</p>`;
      zone.querySelector("#refaire").onclick = () => {
        store.del(cle + ":rep"); store.del(cle + ":fini"); personnalite(app);
      };
    };
    if (store.get(cle + ":fini", false)) montrer(store.get(cle + ":rep", {}));
    else TESTS.questionnaire(zone, { cle, questions: CE.TEST_PERSONNALITE, echelle: CE.ECHELLE_ACCORD, onFini: montrer });
  }

  /* ---------- Parcours possibles ---------- */
  function parcours(app, params) {
    const dom = params.get("domaine") || "sante";
    const preu = CE.DEC.filter((p) => p.type === "preu" && (p.domaine === dom || p.suites.some((id) => bac(id) && bac(id).domaine === dom)));
    const tech = CE.DEC.filter((p) => p.type === "tech" && p.domaine === dom);
    const bacs = CE.BACS.filter((b) => b.domaine === dom);
    const dep = CE.DEP[dom];
    const lienDec = (p) => `<a href="#/secondaire/prealables?prog=${encodeURIComponent(p.code)}">${esc(p.nom)}</a>`;

    app.innerHTML = page({
      titre: "Parcours possibles",
      intro: "Au Québec, plusieurs chemins mènent au même métier. Choisis un domaine pour voir les routes, leur durée et les passerelles.",
      retour: RET,
      contenu: `
      <div class="chips" role="tablist">${Object.entries(CE.DOMAINES).map(([k, v]) =>
        `<a class="chip ${k === dom ? "on" : ""}" href="#/secondaire/parcours?domaine=${k}" role="tab" aria-selected="${k === dom}">${v}</a>`).join("")}
      </div>
      <div class="routes">
        <div class="route">
          <h3>Voie préuniversitaire</h3>
          <ol class="steps">
            <li><b>Secondaire 5</b><span>DES + préalables du programme</span></li>
            <li><b>DEC préuniversitaire · 2 ans</b><span>${preu.length ? preu.map(lienDec).join(", ") : "—"}</span></li>
            <li><b>Baccalauréat · 3 à 4 ans</b><span>${bacs.length ? bacs.map((b) => esc(b.nom)).join(", ") : "Selon le domaine"}</span></li>
            <li><b>Maîtrise, doctorat ou ordre professionnel</b><span>Selon la profession visée</span></li>
          </ol>
        </div>
        <div class="route">
          <h3>Voie technique</h3>
          <ol class="steps">
            <li><b>Secondaire 5</b><span>DES + préalables du programme</span></li>
            <li><b>DEC technique · 3 ans</b><span>${tech.length ? tech.map(lienDec).join(", ") : "Peu de techniques dans ce domaine"}</span></li>
            <li class="fork"><b>Marché du travail</b><span>Tu es technicienne ou technicien qualifié dès le DEC</span></li>
            <li class="fork"><b>ou DEC-BAC</b><span>${tech.filter((p) => p.decBac && p.decBac.length).map((p) =>
              `${esc(p.nom)} → ${p.decBac.map((id) => esc(bac(id).nom)).join(", ")}`).join("<br>") || "Passerelles au cas par cas"}<br><em>Le bac est réduit d'environ une année.</em></span></li>
          </ol>
        </div>
        <div class="route">
          <h3>Formation professionnelle</h3>
          <ol class="steps">
            <li><b>Secondaire 4 ou 5</b><span>Selon le DEP</span></li>
            <li><b>DEP · 600 à 1 800 heures</b><span>${esc(dep.nom)}</span></li>
            <li><b>Métier ou passerelle DEP-DEC</b><span>${esc(dep.suite)}</span></li>
          </ol>
        </div>
        <div class="route alt">
          <h3>Il te manque un préalable ?</h3>
          <ol class="steps">
            <li><b>Tremplin DEC (081.06)</b><span>1 à 3 sessions pour réussir les cours manquants et explorer.</span></li>
            <li><b>Ton programme</b><span>Tu y entres dès que tes préalables sont faits.</span></li>
          </ol>
          <p class="small">Tu peux aussi reprendre un cours à l'éducation des adultes ou à l'été.</p>
        </div>
      </div>
      <p class="muted">Au cégep, tu peux visualiser les cotes R exigées pour chaque baccalauréat dans <a href="#/cegep/admissibilite">le tableau d'admissibilité</a>.</p>`,
    });
  }

  /* ---------- Préalables par cégep ---------- */
  const COURS = [
    ["CST4", "Math CST 4e"], ["TSSN4", "Math TS/SN 4e"], ["CST5", "Math CST 5e"], ["TSSN5", "Math TS/SN 5e"],
    ["STE4", "STE ou SE 4e"], ["CHI5", "Chimie 5e"], ["PHY5", "Physique 5e"],
  ];

  function prealables(app, params) {
    const etat = {
      mode: params.get("prog") ? "prog" : (params.get("mode") || "cegep"),
      prog: params.get("prog") || "200.B1",
      region: store.get("preal:region", "Montréal"),
      cegep: params.get("cegep") || store.get("preal:cegep", null),
      acquis: new Set(store.get("preal:acquis", [])),
    };

    app.innerHTML = page({
      titre: "Préalables du secondaire",
      intro: "Les préalables sont fixés par le ministère : ils sont les mêmes dans tous les cégeps. Certains cégeps ajoutent une audition, un portfolio ou un test. Coche tes cours pour voir instantanément ce qui t'est ouvert.",
      retour: RET,
      contenu: `
      <div class="panel">
        <h2 class="h3">Mes cours réussis (ou en cours)</h2>
        <div class="checks" id="acquis">${COURS.map(([c, l]) =>
          `<label class="check"><input type="checkbox" value="${c}" ${etat.acquis.has(c) ? "checked" : ""}> ${l}</label>`).join("")}
        </div>
      </div>
      <div class="seg" role="tablist">
        <button class="${etat.mode === "cegep" ? "on" : ""}" data-mode="cegep">Par cégep</button>
        <button class="${etat.mode === "prog" ? "on" : ""}" data-mode="prog">Par programme</button>
      </div>
      <div id="vue"></div>
      <p class="muted small">Offre de programmes indicative et partielle : consulte le site du cégep ou
        <a href="https://www.inforoutefpt.org" target="_blank" rel="noopener">Inforoute FPT</a> pour la liste complète.</p>`,
    });

    const vue = app.querySelector("#vue");
    const statut = (p) => {
      if (!etat.acquis.size) return "";
      const m = manquants(p, etat.acquis);
      return m.length
        ? `<span class="badge ko" title="${esc(m.join(", "))}">Manque : ${esc(m.join(", "))}</span>`
        : `<span class="badge ok">Admissible</span>`;
    };

    function rendre() {
      app.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b.dataset.mode === etat.mode));
      if (etat.mode === "cegep") {
        const regions = [...new Set(CE.CEGEPS.map((c) => c.region))];
        const dansRegion = CE.CEGEPS.filter((c) => c.region === etat.region);
        if (!etat.cegep || !dansRegion.some((c) => c.id === etat.cegep)) etat.cegep = dansRegion[0].id;
        const cg = UI.cegep(etat.cegep);
        const progs = CE.DEC.filter((p) => cegepsDe(p).some((c) => c.id === cg.id));
        vue.innerHTML = `
          <div class="filters">
            <label>Région <select id="region">${regions.map((r) => `<option ${r === etat.region ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></label>
            <label>Cégep <select id="cegep">${dansRegion.map((c) => `<option value="${c.id}" ${c.id === cg.id ? "selected" : ""}>${esc(c.nom)}</option>`).join("")}</select></label>
          </div>
          <h2>${esc(cg.nom)} <span class="muted small">${esc(cg.ville)}${cg.langue === "en" ? " · anglophone" : ""}</span></h2>
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>Programme</th><th>Type</th><th>Préalables du secondaire</th><th>Toi</th></tr></thead>
            <tbody>${progs.map((p) => `<tr>
              <td><b>${esc(p.nom)}</b><br><span class="muted small">${decCode(p)}</span></td>
              <td><span class="tag ${p.type}">${typeLabel[p.type]}</span></td>
              <td>${prealablesTexte(p).map(esc).join("<br>")}${p.note ? `<br><em class="small">${esc(p.note)}</em>` : ""}</td>
              <td>${statut(p) || '<span class="muted small">Coche tes cours</span>'}</td>
            </tr>`).join("")}</tbody>
          </table></div>`;
        vue.querySelector("#region").onchange = (e) => { etat.region = e.target.value; etat.cegep = null; store.set("preal:region", etat.region); rendre(); };
        vue.querySelector("#cegep").onchange = (e) => { etat.cegep = e.target.value; store.set("preal:cegep", etat.cegep); rendre(); };
      } else {
        const p = dec(etat.prog) || CE.DEC[0];
        const liste = cegepsDe(p);
        const parRegion = {};
        liste.forEach((c) => (parRegion[c.region] = parRegion[c.region] || []).push(c));
        vue.innerHTML = `
          <div class="filters">
            <label>Programme <select id="prog">${CE.DEC.map((x) => `<option value="${x.code}" ${x.code === p.code ? "selected" : ""}>${esc(x.nom)} (${decCode(x)})</option>`).join("")}</select></label>
          </div>
          <div class="prog-detail">
            ${progDetail(p)}
            <div>${statut(p)}</div>
          </div>
          <h2>Offert ${p.partout ? "dans pratiquement tous les cégeps" : `notamment dans ${liste.length} cégep${liste.length > 1 ? "s" : ""}`}</h2>
          <div class="regions">${Object.entries(parRegion).map(([r, cs]) => `
            <div class="region"><h3>${esc(r)}</h3><ul>${cs.map((c) =>
              `<li><a href="#/secondaire/prealables?mode=cegep&cegep=${c.id}" data-cegep="${c.id}" data-region="${esc(c.region)}">${esc(c.nom)}</a></li>`).join("")}</ul></div>`).join("")}
          </div>`;
        vue.querySelector("#prog").onchange = (e) => { etat.prog = e.target.value; rendre(); };
        vue.querySelectorAll("[data-cegep]").forEach((a) => a.onclick = (e) => {
          e.preventDefault();
          etat.mode = "cegep"; etat.cegep = a.dataset.cegep; etat.region = a.dataset.region;
          store.set("preal:region", etat.region); store.set("preal:cegep", etat.cegep);
          rendre(); window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    }

    app.querySelector("#acquis").onchange = () => {
      etat.acquis = new Set([...app.querySelectorAll("#acquis input:checked")].map((i) => i.value));
      store.set("preal:acquis", [...etat.acquis]);
      rendre();
    };
    app.querySelectorAll(".seg button").forEach((b) => b.onclick = () => { etat.mode = b.dataset.mode; rendre(); });
    rendre();
  }

  function progDetail(p) {
    return `<div>
      <span class="tag ${p.type}">${typeLabel[p.type]}</span>
      <h2>${esc(p.nom)} <span class="muted">${decCode(p)}</span></h2>
      <p>${esc(p.resume)}</p>
      <p><strong>Préalables :</strong> ${prealablesTexte(p).map(esc).join(" · ")}</p>
      ${p.note ? `<p class="small"><em>${esc(p.note)}</em></p>` : ""}
      ${p.suites.length ? `<p class="small"><strong>Mène notamment à :</strong> ${p.suites.map((id) => esc(bac(id).nom)).join(", ")}</p>` : ""}
    </div>`;
  }

  window.SECONDAIRE = { accueil, interets, personnalite, parcours, prealables };
})();
