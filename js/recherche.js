/* Recherche dans toutes les informations : universités (fiches et bourses), cégeps, programmes, aides financières. */
(function () {
  const { esc, store, page, fmt, uni, decCode, cegepsDe, prealablesTexte, typeLabel, debounce } = UI;

  const TYPES = { tout: "Tout", uni: "Universités", cegep: "Cégeps", programme: "Programmes", aide: "Bourses et aides" };
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  /* Index construit une fois : chaque entrée a un type, un texte cherchable et une fonction d'affichage. */
  let INDEX = null;
  function index() {
    if (INDEX) return INDEX;
    INDEX = [];
    CE.UNIVERSITES.forEach((u) => {
      const f = CE.FICHES[u.id] || {};
      const progs = CE.BACS.filter((b) => b.offres.some((o) => o.u === u.id));
      INDEX.push({ type: "uni", titre: u.nom, u, f, progs,
        texte: [u.nom, u.court, u.ville, f.taille, (f.campus || []).join(" "), (f.forces || []).join(" "), f.vie, f.logement,
          (f.aides || []).join(" "), Object.values(u.notes).join(" "), progs.map((b) => b.nom).join(" "), "bourse aide residence"].join(" ") });
      (f.aides || []).forEach((a) => INDEX.push({ type: "aide", sous: "ecole", titre: a, organisme: u.nom, u,
        niveaux: ["uni"], criteres: /excellence/i.test(a) ? ["excellence"] : /besoin|urgence/i.test(a) ? ["besoin"] : /région|loin|extérieur/i.test(a) ? ["eloignement"] : [],
        texte: `${a} ${u.nom} ${u.court} ${u.ville} bourse aide université` }));
    });
    CE.AIDES.forEach((a) => INDEX.push({ type: "aide", sous: a.type, titre: a.nom, a, niveaux: a.niveaux, criteres: a.criteres,
      texte: [a.nom, a.organisme, a.desc, a.montant, a.quand, a.criteres.map((c) => CE.CRITERES_AIDE[c]).join(" "), CE.TYPES_AIDE[a.type]].join(" ") }));
    CE.CEGEPS.forEach((c) => {
      const progs = CE.DEC.filter((p) => cegepsDe(p).some((x) => x.id === c.id));
      INDEX.push({ type: "cegep", titre: c.nom, c, progs, texte: [c.nom, c.ville, c.region, c.langue === "en" ? "anglophone english" : "francophone", progs.map((p) => p.nom).join(" ")].join(" ") });
    });
    CE.DEC.forEach((p) => INDEX.push({ type: "programme", sous: "dec", titre: p.nom, p, texte: [p.nom, decCode(p), p.resume, CE.DOMAINES[p.domaine], typeLabel[p.type], "dec cégep"].join(" ") }));
    CE.BACS.forEach((b) => INDEX.push({ type: "programme", sous: "bac", titre: b.nom, b, texte: [b.nom, CE.DOMAINES[b.domaine], b.preal, b.offres.map((o) => uni(o.u).nom + " " + uni(o.u).court).join(" "), "baccalauréat université"].join(" ") }));
    INDEX.forEach((e) => (e.n = norm(e.texte + " " + e.titre)));
    return INDEX;
  }

  function recherche(app, params) {
    const st = Object.assign({ q: "", niveau: "", critere: "" }, store.get("recherche", {}));
    // Le type vient du lien suivi (ex. « Bourses et aides ») ; sinon on cherche partout.
    st.type = TYPES[params.get("type")] ? params.get("type") : "tout";
    if (params.get("q") != null) st.q = params.get("q");

    app.innerHTML = page({
      titre: "Écoles, bourses et aides",
      intro: "Cherche dans toutes les informations du site : fiches des universités et des cégeps, programmes, bourses d'admission, aides financières, emplois et mobilité. Essaie par exemple « résidence », « Rimouski », « bourse d'accueil » ou « génie ».",
      retour: { href: "#/", label: "Accueil" },
      contenu: `
      <div class="panel search-box">
        <input type="search" id="q" value="${esc(st.q)}" placeholder="Rechercher une école, une ville, une bourse, un programme…" aria-label="Rechercher" autocomplete="off">
      </div>
      <div class="chips" id="types">${Object.entries(TYPES).map(([k, v]) => `<button class="chip ${k === st.type ? "on" : ""}" data-t="${k}">${v}</button>`).join("")}</div>
      <div class="filters" id="filtres-aide">
        <label>Niveau <select id="niveau"><option value="">Tous</option><option value="cegep" ${st.niveau === "cegep" ? "selected" : ""}>Cégep</option><option value="uni" ${st.niveau === "uni" ? "selected" : ""}>Université</option></select></label>
        <label>Pour qui <select id="critere"><option value="">Tout le monde</option>${Object.entries(CE.CRITERES_AIDE).map(([k, v]) => `<option value="${k}" ${k === st.critere ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      </div>
      <p class="muted small" id="compte"></p>
      <div id="res" class="results"></div>
      <p class="muted small">Montants et dates indicatifs : ils changent chaque année. Vérifie toujours sur le site de l'organisme.</p>`,
    });

    const $ = (s) => app.querySelector(s);

    function rendre() {
      store.set("recherche", st);
      $("#filtres-aide").hidden = !(st.type === "aide" || st.type === "tout");
      const mots = norm(st.q).split(/\s+/).filter(Boolean);
      let res = index().filter((e) => (st.type === "tout" || e.type === st.type) && mots.every((m) => e.n.includes(m)));
      if (st.niveau) res = res.filter((e) => e.type !== "aide" || e.niveaux.includes(st.niveau));
      if (st.critere) res = res.filter((e) => e.type !== "aide" || e.criteres.includes(st.critere));
      // Pertinence : titre qui contient la recherche en premier, puis par type.
      const ordre = { uni: 0, aide: 1, programme: 2, cegep: 3 };
      res.sort((x, y) => (mots.length ? (mots.every((m) => norm(y.titre).includes(m)) - mots.every((m) => norm(x.titre).includes(m))) : 0)
        || ordre[x.type] - ordre[y.type] || x.titre.localeCompare(y.titre, "fr"));
      const n = res.length;
      $("#compte").textContent = `${n} résultat${n > 1 ? "s" : ""}${n > 60 ? " (60 premiers affichés : précise ta recherche)" : ""}`;
      $("#res").innerHTML = n ? res.slice(0, 60).map(carte).join("") : `<p class="muted">Aucun résultat. Essaie un autre mot ou enlève un filtre.</p>`;
    }

    $("#q").oninput = debounce((e) => { st.q = e.target.value; rendre(); }, 120);
    $("#types").onclick = (e) => {
      const t = e.target.dataset.t; if (!t) return;
      st.type = t; app.querySelectorAll("#types .chip").forEach((c) => c.classList.toggle("on", c.dataset.t === t)); rendre();
    };
    $("#niveau").onchange = (e) => { st.niveau = e.target.value; rendre(); };
    $("#critere").onchange = (e) => { st.critere = e.target.value; rendre(); };
    rendre();
    $("#q").focus();
  }

  function carte(e) {
    if (e.type === "uni") {
      return `<details class="res-card">
        <summary><span class="res-kind uni">Université</span><b>${esc(e.u.nom)}</b><span class="muted small">${esc(e.u.ville)} · ${e.u.langue === "fr" ? "français" : "anglais"} · ${e.progs.length} programmes répertoriés</span></summary>
        <div class="res-body">
          ${FICHE.html(e.u, e.f)}
          <h4>Programmes répertoriés</h4>
          <div class="tags">${e.progs.map((b) => {
            const o = b.offres.find((x) => x.u === e.u.id);
            return `<a class="tag" href="#/cegep/admissibilite?bac=${b.id}">${esc(b.nom)}${o.cote != null ? ` · ${fmt(o.cote, 1)}` : ""}</a>`;
          }).join("")}</div>
          <div class="row-actions"><a class="btn small" href="${e.u.site}" target="_blank" rel="noopener">Site de l'admission</a>
            <a class="btn ghost small" href="#/budget?ville=${encodeURIComponent(e.u.ville)}">Budget à ${esc(e.u.ville)}</a></div>
        </div></details>`;
    }
    if (e.type === "aide") {
      if (e.sous === "ecole") {
        return `<article class="res-card flat"><span class="res-kind aide">Bourse de l'université</span><b>${esc(e.titre)}</b>
          <span class="muted small">${esc(e.organisme)}</span>
          <a class="small" href="${e.u.site}" target="_blank" rel="noopener">Site de l'université →</a></article>`;
      }
      const a = e.a;
      return `<article class="res-card flat">
        <span class="res-kind aide">${esc(CE.TYPES_AIDE[a.type])}</span><b>${esc(a.nom)}</b>
        <span class="muted small">${esc(a.organisme)} · ${a.niveaux.map((n) => (n === "uni" ? "université" : "cégep")).join(", ")}</span>
        <p>${esc(a.desc)}</p>
        <p class="small"><b>Montant :</b> ${esc(a.montant)}<br><b>Quand :</b> ${esc(a.quand)}</p>
        <div class="tags">${a.criteres.map((c) => `<span class="tag">${esc(CE.CRITERES_AIDE[c])}</span>`).join("")}</div>
        <a class="small" href="${a.lien}" target="_blank" rel="noopener">Site officiel →</a>
      </article>`;
    }
    if (e.type === "cegep") {
      return `<article class="res-card flat"><span class="res-kind cegep">Cégep</span><b>${esc(e.c.nom)}</b>
        <span class="muted small">${esc(e.c.ville)} · ${esc(e.c.region)}${e.c.langue === "en" ? " · anglophone" : ""} · ${e.progs.length} programmes répertoriés</span>
        <a class="small" href="#/secondaire/prealables?mode=cegep&cegep=${e.c.id}">Programmes et préalables →</a>
        <a class="small" href="#/budget?ville=${encodeURIComponent(e.c.ville.split(",")[0])}">Budget dans cette ville →</a></article>`;
    }
    if (e.sous === "dec") {
      const p = e.p;
      return `<article class="res-card flat"><span class="res-kind prog">DEC · ${decCode(p)}</span><b>${esc(p.nom)}</b>
        <span class="muted small">${typeLabel[p.type]} · ${esc(CE.DOMAINES[p.domaine])}</span>
        <p class="small">${esc(p.resume)}</p><p class="small"><b>Préalables :</b> ${prealablesTexte(p).map(esc).join(" · ")}</p>
        <a class="small" href="#/secondaire/prealables?prog=${encodeURIComponent(p.code)}">Où l'étudier →</a></article>`;
    }
    const b = e.b;
    const cotes = b.offres.filter((o) => o.cote != null).map((o) => o.cote);
    return `<article class="res-card flat"><span class="res-kind prog">Baccalauréat</span><b>${esc(b.nom)}</b>
      <span class="muted small">${esc(CE.DOMAINES[b.domaine])} · ${b.offres.length} universités${cotes.length ? ` · cote R de ${fmt(Math.min(...cotes), 1)} à ${fmt(Math.max(...cotes), 1)}` : ""}</span>
      <p class="small"><b>Préalables :</b> ${esc(b.preal)}</p>
      <a class="small" href="#/cegep/admissibilite?bac=${b.id}">Universités et cotes R →</a></article>`;
  }

  window.RECHERCHE = { recherche };
})();
