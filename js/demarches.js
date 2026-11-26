/* Dates et démarches : calendrier d'admission calculé pour le cycle en cours, étapes et documents. */
(function () {
  const { esc, store, page } = UI;

  const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const jour = (d) => `${d.getDate() === 1 ? "1er" : d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
  const JOUR = 86400000;

  const ETAPES = {
    secondaire: [
      ["Explore", "Fais les tests d'intérêts et de personnalité, puis regarde les parcours possibles.", "#/secondaire/interets"],
      ["Vérifie tes préalables", "Les cours de 4e et 5e secondaire (maths, sciences) ouvrent ou ferment des portes.", "#/secondaire/prealables"],
      ["Visite", "Portes ouvertes, « étudiant d'un jour », rencontre avec ton conseiller d'orientation.", null],
      ["Fais ta demande", "Un seul programme et un seul cégep par tour, au service régional d'admission (SRAM, SRACQ, SRASL) ou directement au cégep.", "https://www.sram.qc.ca"],
      ["Confirme et prépare ta rentrée", "Accepte ton offre, fais ta demande d'aide financière et, si tu déménages, trouve un logement.", "#/budget"],
    ],
    cegep: [
      ["Calcule ta cote R", "Et fais une prévision pour savoir ce qu'il te faut d'ici la fin du DEC.", "#/cegep/cote-r"],
      ["Compare les universités", "Programmes accessibles avec ta cote, classement selon tes critères, fiches avec bourses et vie sociale.", "#/cegep/admissibilite"],
      ["Postule aux bourses", "Plusieurs concours ferment avant même la date limite d'admission.", "#/recherche?type=aide"],
      ["Fais tes demandes d'admission", "Directement sur le site de chaque université ; tu peux postuler à plusieurs programmes et universités.", null],
      ["Réserve ton logement et ton aide", "Résidences (souvent dès mars ou avril) et aide financière aux études avant le 30 juin.", "#/budget"],
    ],
  };

  function demarches(app, params) {
    const niveau = params.get("niveau") === "cegep" ? "cegep" : (params.get("niveau") === "secondaire" ? "secondaire" : store.get("demarches:niveau", "secondaire"));
    store.set("demarches:niveau", niveau);
    const cycle = CE.cycleAdmission();
    const auj = new Date(); auj.setHours(0, 0, 0, 0);
    const coches = new Set(store.get("demarches:docs", []));

    const evts = CE.CALENDRIER[niveau].map((e) => {
      const debut = new Date(cycle + e.an, e.m - 1, e.j);
      const fin = e.fin ? new Date(cycle + e.fin.an, e.fin.m - 1, e.fin.j) : debut;
      const etat = fin < auj ? "passe" : debut <= auj ? "encours" : "avenir";
      return Object.assign({}, e, { debut, fin, etat, dans: Math.round((debut - auj) / JOUR) });
    }).sort((a, b) => a.debut - b.debut);
    const prochain = evts.find((e) => e.etat !== "passe");

    const lien = (h, t) => h ? `<a class="small" href="${h}" ${h.startsWith("#") ? "" : 'target="_blank" rel="noopener"'}>${t} →</a>` : "";

    app.innerHTML = page({
      titre: "Dates et démarches",
      intro: `Le calendrier se calcule tout seul pour la rentrée de l'automne ${cycle}. Les dates sont celles des années précédentes : confirme toujours sur le site officiel, elles peuvent bouger d'un jour ou deux.`,
      retour: { href: "#/", label: "Accueil" },
      contenu: `
      <div class="seg" role="tablist" id="niv">
        <button class="${niveau === "secondaire" ? "on" : ""}" data-n="secondaire">Je vais au cégep</button>
        <button class="${niveau === "cegep" ? "on" : ""}" data-n="cegep">Je vais à l'université</button>
      </div>
      ${prochain ? `<div class="panel prochain"><span class="muted small">Prochaine étape</span>
        <h2 class="h3">${esc(prochain.t)}</h2>
        <p>${prochain.etat === "encours" ? "<b>En ce moment</b>" : `<b>${jour(prochain.debut)}</b> · dans ${prochain.dans} jour${prochain.dans > 1 ? "s" : ""}`}</p>
        <p class="small">${esc(prochain.d)}</p></div>` : ""}
      <h2 class="section-titre">Calendrier ${cycle - 1}-${cycle}</h2>
      <ol class="timeline">${evts.map((e) => `
        <li class="tl-${e.etat}${e.important ? " tl-important" : ""}">
          <span class="tl-date">${e.fin > e.debut ? `${jour(e.debut)} au ${jour(e.fin)}` : jour(e.debut)}</span>
          <b>${esc(e.t)}</b>
          <span class="badge ${e.etat === "passe" ? "info" : e.etat === "encours" ? "ok" : e.dans <= 30 ? "mid" : "info"}">${e.etat === "passe" ? "Passé" : e.etat === "encours" ? "En cours" : `Dans ${e.dans} j`}</span>
          <p class="small">${esc(e.d)}</p>${lien(e.lien, "En savoir plus")}
        </li>`).join("")}</ol>
      <h2 class="section-titre">Les étapes</h2>
      <ol class="etapes">${ETAPES[niveau].map(([t, d, h]) => `<li><b>${esc(t)}</b><p class="small">${esc(d)}</p>${lien(h, "Y aller")}</li>`).join("")}</ol>
      <div class="panel">
        <h2 class="h3">Ma liste de documents</h2>
        <div class="checks" id="docs">${CE.CALENDRIER.documents.map((d, i) =>
          `<label class="check"><input type="checkbox" value="${i}" ${coches.has(i) ? "checked" : ""}> ${esc(d)}</label>`).join("")}</div>
        <p class="muted small" id="docs-n"></p>
      </div>
      <div class="panel">
        <h2 class="h3">Combien ça coûte ?</h2>
        <p class="small">${esc(CE.DROITS.note)}</p>
        <a class="small" href="#/budget">Estimer mon budget complet →</a>
      </div>`,
    });

    const compte = () => { app.querySelector("#docs-n").textContent = `${coches.size} sur ${CE.CALENDRIER.documents.length} prêts`; };
    app.querySelector("#docs").onchange = (e) => {
      const i = Number(e.target.value);
      if (e.target.checked) coches.add(i); else coches.delete(i);
      store.set("demarches:docs", [...coches]); compte();
    };
    app.querySelector("#niv").onclick = (e) => { const n = e.target.dataset.n; if (n) location.hash = `#/demarches?niveau=${n}`; };
    compte();
  }

  window.DEMARCHES = { demarches };
})();
