/* Budget de l'étudiant qui quitte la maison pour ses études (cégep ou université). */
(function () {
  const { esc, store, page, fmt, num, debounce } = UI;

  const LIEUX = Object.keys(CE.LIEUX).sort((a, b) => a.localeCompare(b, "fr"));
  const VILLES_ETUDES = ["Montréal", "Québec", "Sherbrooke", "Trois-Rivières", "Saguenay", "Rimouski", "Gatineau", "Rouyn-Noranda",
    ...LIEUX.filter((l) => !["Montréal", "Québec", "Sherbrooke", "Trois-Rivières", "Saguenay", "Rimouski", "Gatineau", "Rouyn-Noranda"].includes(l))];
  const MOIS_ETUDES = 8; // septembre à avril
  const SEMAINES_ETUDES = 30;

  const loyers = (ville) => CE.LOYERS[ville] || CE.LOYERS._region;

  /* Valeurs par défaut selon la ville, le niveau et le logement. */
  function defauts(b) {
    const L = loyers(b.ville);
    const F = CE.FRAIS[b.niveau];
    const app = b.logement === "seul";
    return {
      loyer: b.logement === "famille" ? 0 : L[b.logement],
      epicerie: b.logement === "famille" ? 100 : 350,
      transport: L.transport,
      telephone: 45,
      internet: app ? 60 : b.logement === "coloc" ? 25 : 0,
      electricite: app ? 50 : b.logement === "coloc" ? 20 : 0,
      assurance: b.logement === "famille" ? 0 : 20,
      loisirs: 100,
      divers: 60,
      scolarite: F.scolarite,
      materiel: F.materiel,
      installation: b.logement === "famille" ? 0 : b.logement === "residence" ? 200 : 600,
    };
  }

  const MENSUEL = [
    ["loyer", "Loyer"], ["epicerie", "Épicerie"], ["transport", "Transport en commun"], ["telephone", "Cellulaire"],
    ["internet", "Internet"], ["electricite", "Électricité"], ["assurance", "Assurance habitation"], ["loisirs", "Sorties et loisirs"], ["divers", "Vêtements, soins, divers"],
  ];
  const ANNUEL = [["scolarite", "Droits et frais de scolarité"], ["materiel", "Livres, matériel, logiciels"], ["installation", "Installation (meubles, dépôt, cuisine)"]];

  function budget(app, params) {
    const sauve = store.get("budget", null);
    const b = Object.assign({
      niveau: "uni", ville: "Montréal", origine: store.get("origine", ""), logement: "residence", bail12: false,
      retours: 6, moyen: "autocar",
      ete: 4000, heures: 10, taux: CE.SALAIRE_MIN, parents: 0, afe: 0, bourses: 0,
      montants: null,
    }, sauve || {});
    if (params.get("ville")) b.ville = params.get("ville") === "À distance" ? b.ville : params.get("ville");
    if (!b.montants) b.montants = defauts(b);

    app.innerHTML = page({
      titre: "Budget pour étudier loin de chez soi",
      intro: "Estime ce que coûte une année d'études quand tu quittes la maison : logement, épicerie, retours chez toi, frais de scolarité. Tous les montants sont modifiables ; les valeurs proposées sont des estimations.",
      retour: { href: "#/", label: "Accueil" },
      contenu: `
      <div class="grid2">
        <div class="panel">
          <h2 class="h3">Ma situation</h2>
          <div class="form cols">
            <label>J'étudie au <select id="niveau"><option value="cegep" ${b.niveau === "cegep" ? "selected" : ""}>Cégep</option><option value="uni" ${b.niveau === "uni" ? "selected" : ""}>Université</option></select></label>
            <label>Ville d'études <select id="ville">${VILLES_ETUDES.map((v) => `<option ${v === b.ville ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
            <label>Ma ville d'origine <select id="origine"><option value="">— Choisir —</option>${LIEUX.map((l) => `<option ${l === b.origine ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
            <label>Logement <select id="logement">${Object.entries(CE.LOGEMENT_TYPES).map(([k, v]) => `<option value="${k}" ${k === b.logement ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          </div>
          <label class="check" style="margin-top:.75rem"><input type="checkbox" id="bail12" ${b.bail12 ? "checked" : ""}> Bail de 12 mois (je paie le loyer l'été aussi)</label>
          <p class="hint" id="note-ville"></p>
          <button class="btn ghost small" id="reinit">Remettre les montants suggérés</button>
        </div>
        <div class="panel">
          <h2 class="h3">Retours à la maison</h2>
          <div class="form cols">
            <label>Allers-retours par année <input id="retours" inputmode="numeric" value="${esc(b.retours)}"></label>
            <label>Moyen <select id="moyen">${Object.entries(CE.TRANSPORT_RETOUR).map(([k, v]) => `<option value="${k}" ${k === b.moyen ? "selected" : ""}>${v.nom}</option>`).join("")}</select></label>
          </div>
          <p class="small" id="distance"></p>
          <h2 class="h3" style="margin-top:1rem">Mes revenus pour l'année</h2>
          <div class="form cols">
            <label>Économies de l'été <input id="ete" inputmode="decimal" value="${esc(b.ete)}"></label>
            <label>Heures de travail / semaine <input id="heures" inputmode="decimal" value="${esc(b.heures)}"></label>
            <label>Taux horaire <input id="taux" inputmode="decimal" value="${esc(String(b.taux).replace(".", ","))}"></label>
            <label>Aide des parents / mois <input id="parents" inputmode="decimal" value="${esc(b.parents)}"></label>
            <label>Prêts et bourses AFE / an <input id="afe" inputmode="decimal" value="${esc(b.afe)}"></label>
            <label>Autres bourses / an <input id="bourses" inputmode="decimal" value="${esc(b.bourses)}"></label>
          </div>
          <p class="hint">L'Aide financière aux études reconnaît plus de dépenses quand tu n'habites pas chez tes parents. <a href="https://www.quebec.ca/education/aide-financiere-aux-etudes" target="_blank" rel="noopener">Estime ton aide</a> · <a href="#/recherche?type=aide">Voir les bourses</a></p>
        </div>
      </div>

      <div class="grid2">
        <div class="panel">
          <h2 class="h3">Dépenses par mois <span class="muted small">(sur ${MOIS_ETUDES} mois d'études)</span></h2>
          <div class="money" id="mensuel">${MENSUEL.map(([k, t]) => ligneMontant(k, t, b.montants[k])).join("")}</div>
          <h2 class="h3" style="margin-top:1rem">Dépenses une fois par année</h2>
          <div class="money" id="annuel">${ANNUEL.map(([k, t]) => ligneMontant(k, t, b.montants[k])).join("")}</div>
          <p class="hint" id="note-frais"></p>
        </div>
        <div class="panel" id="bilan"></div>
      </div>`,
    });

    const $ = (s) => app.querySelector(s);
    const bilan = $("#bilan");

    function lireMontants() {
      [...MENSUEL, ...ANNUEL].forEach(([k]) => (b.montants[k] = num($("#m-" + k).value) ?? 0));
    }
    function ecrireMontants() {
      [...MENSUEL, ...ANNUEL].forEach(([k]) => ($("#m-" + k).value = b.montants[k]));
    }

    function calculer() {
      ["retours", "ete", "heures", "taux", "parents", "afe", "bourses"].forEach((k) => (b[k] = num($("#" + k).value) ?? 0));
      b.bail12 = $("#bail12").checked;
      lireMontants();
      store.set("budget", b);

      const L = loyers(b.ville);
      $("#note-ville").textContent = L.noteTransport || (CE.LOYERS[b.ville] ? "" : "Loyers estimés pour une ville en région.");
      $("#note-frais").textContent = CE.FRAIS[b.niveau].note;

      // Retours à la maison
      const km = b.origine ? CE.distanceKm(b.origine, b.ville) : null;
      const T = CE.TRANSPORT_RETOUR[b.moyen];
      const parRetour = km ? Math.max(km * 2 * T.parKm, T.minimum ? T.minimum * 2 : 0) : 0;
      const retoursTotal = parRetour * b.retours;
      $("#distance").innerHTML = !b.origine
        ? `<span class="muted">Choisis ta ville d'origine pour estimer tes déplacements.</span>`
        : km < 40 ? `Tu étudies près de chez toi (≈ ${fmt(km, 0)} km) : pas de frais de retour importants.`
        : `≈ <b>${fmt(km, 0)} km</b> entre ${esc(b.origine)} et ${esc(b.ville)}, environ ${fmt(km / 85, 1)} h de route. Un aller-retour ≈ <b>${fmt(parRetour, 0)} $</b>.`;

      const m = b.montants;
      const moisLoyer = b.bail12 ? 12 : MOIS_ETUDES;
      const postes = [
        { t: "Logement", v: m.loyer * moisLoyer + (m.electricite + m.internet + m.assurance) * moisLoyer },
        { t: "Épicerie", v: m.epicerie * MOIS_ETUDES },
        { t: "Transport local", v: m.transport * MOIS_ETUDES },
        { t: "Retours à la maison", v: km && km >= 40 ? retoursTotal : 0 },
        { t: "Scolarité et matériel", v: m.scolarite + m.materiel },
        { t: "Cellulaire, loisirs, divers", v: (m.telephone + m.loisirs + m.divers) * MOIS_ETUDES },
        { t: "Installation", v: m.installation },
      ];
      const depenses = postes.reduce((s, p) => s + p.v, 0);
      const travail = b.heures * b.taux * SEMAINES_ETUDES;
      const revenus = [
        { t: "Économies de l'été", v: b.ete },
        { t: `Travail pendant l'année (${fmt(b.heures, 0)} h × ${SEMAINES_ETUDES} sem.)`, v: travail },
        { t: "Aide des parents", v: b.parents * MOIS_ETUDES },
        { t: "Prêts et bourses AFE", v: b.afe },
        { t: "Autres bourses", v: b.bourses },
      ];
      const entrees = revenus.reduce((s, p) => s + p.v, 0);
      const solde = entrees - depenses;
      const max = Math.max(...postes.map((p) => p.v), 1);

      bilan.innerHTML = `
        <h2 class="h3">Mon année d'études</h2>
        <div class="budget-totaux">
          <div class="stat"><span class="muted small">Dépenses</span><strong>${fmt(depenses, 0)} $</strong><span class="muted small">≈ ${fmt(depenses / MOIS_ETUDES, 0)} $ par mois d'études</span></div>
          <div class="stat"><span class="muted small">Revenus</span><strong>${fmt(entrees, 0)} $</strong></div>
          <div class="stat solde ${solde >= 0 ? "pos" : "neg"}"><span class="muted small">${solde >= 0 ? "Il te reste" : "Il te manque"}</span><strong>${fmt(Math.abs(solde), 0)} $</strong></div>
        </div>
        <div class="bars budget-bars">${postes.filter((p) => p.v > 0).sort((x, y) => y.v - x.v).map((p) => `
          <div class="bar-row"><span class="bar-lab">${esc(p.t)}</span><span class="bar"><span style="width:${(p.v / max) * 100}%"></span></span><span class="bar-val">${fmt(p.v, 0)} $</span></div>`).join("")}
        </div>
        <details><summary>Détail des revenus</summary><ul class="small">${revenus.map((r) => `<li>${esc(r.t)} : <b>${fmt(r.v, 0)} $</b></li>`).join("")}</ul></details>
        ${conseils(b, solde, km)}`;
    }

    function conseils(b, solde, km) {
      const c = [];
      if (solde < 0) c.push(`Il manque environ <b>${fmt(-solde / MOIS_ETUDES, 0)} $ par mois</b>. Fais une demande à l'<a href="https://www.quebec.ca/education/aide-financiere-aux-etudes" target="_blank" rel="noopener">Aide financière aux études</a> : étudier loin de chez tes parents augmente l'aide accordée.`);
      if (b.logement === "seul") c.push(`La colocation à ${esc(b.ville)} coûte environ ${fmt(loyers(b.ville).coloc, 0)} $ par mois, contre ${fmt(loyers(b.ville).seul, 0)} $ seul.`);
      if (b.bail12 && b.logement !== "residence") c.push("Une sous-location l'été peut te faire économiser plusieurs mois de loyer.");
      if (km && km > 300 && b.retours > 4) c.push("Avec cette distance, le covoiturage ou l'achat des billets à l'avance réduit beaucoup le coût des retours.");
      if (b.heures > 15) c.push("Plus de 15 heures de travail par semaine peut nuire aux résultats scolaires (et à ta cote R).");
      c.push(`Consulte la section <a href="#/recherche?type=aide">bourses et aides</a> : plusieurs fondations aident les étudiants qui viennent de loin.`);
      return `<h3 class="h3" style="margin-top:1rem">Conseils</h3><ul class="conseils">${c.map((x) => `<li>${x}</li>`).join("")}</ul>`;
    }

    const recalculer = debounce(calculer, 80);
    // Écouteur posé sur la page (et non sur #app, qui est réutilisé par les autres pages).
    app.querySelector(".page").oninput = (e) => { if (e.target.matches("input")) recalculer(); };
    ["niveau", "ville", "logement"].forEach((k) => ($("#" + k).onchange = (e) => {
      b[k] = e.target.value;
      const d = defauts(b);
      // Les montants qui dépendent du choix sont remis aux valeurs suggérées.
      ["loyer", "transport", "internet", "electricite", "assurance", "epicerie", "scolarite", "materiel", "installation"].forEach((x) => (b.montants[x] = d[x]));
      ecrireMontants(); calculer();
    }));
    $("#origine").onchange = (e) => { b.origine = e.target.value; store.set("origine", b.origine); calculer(); };
    $("#moyen").onchange = (e) => { b.moyen = e.target.value; calculer(); };
    $("#bail12").onchange = calculer;
    $("#reinit").onclick = () => { b.montants = defauts(b); ecrireMontants(); calculer(); };
    calculer();
  }

  function ligneMontant(k, t, v) {
    return `<label class="money-row"><span>${esc(t)}</span><span class="money-in"><input id="m-${k}" inputmode="decimal" value="${esc(v)}" aria-label="${esc(t)}"><span>$</span></span></label>`;
  }

  window.BUDGET = { budget };
})();
