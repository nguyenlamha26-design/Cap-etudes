/* Fiche d'une école (université ou cégep) : s'ouvre dans une fenêtre par-dessus la page
 * quand on clique sur un élément portant data-fiche="u:<id>" ou data-fiche="c:<id>".
 * Bourses et vie sociale sont en tête de fiche. */
(function () {
  const { esc, fmt, uni, cegep, cegepsDe } = UI;

  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const dateTexte = (iso) => { const [a, m, j] = iso.split("-").map(Number); return `${j} ${MOIS[m - 1]} ${a}`; };

  /* Fraîcheur : une info publiée pour une année d'admission antérieure au cycle en cours est « à revérifier ». */
  function fraicheur(annee) {
    const cycle = CE.cycleAdmission();
    return annee >= cycle
      ? `<span class="badge ok" title="Information publiée pour l'admission ${annee}">Admission ${annee}</span>`
      : `<span class="badge mid" title="Information publiée pour l'admission ${annee} : le montant ou la date peut avoir changé pour ${cycle}">Info ${annee} · à revérifier</span>`;
  }

  function boursesHtml(u) {
    const liste = CE.BOURSES_UNI[u.id] || [];
    if (!liste.length) return `<p class="muted small">Aucune bourse répertoriée pour l'instant : consulte le <a href="${u.site}" target="_blank" rel="noopener">site de l'université</a>.</p>`;
    return `<div class="bourses">${liste.map((b) => `
      <article class="bourse">
        <div class="bourse-tete"><b>${esc(b.nom)}</b><span class="bourse-montant">${esc(b.montant)}</span></div>
        <p class="small">${esc(b.conditions)}</p>
        <div class="bourse-pied small">
          <span class="badge ${b.mode === "auto" ? "info" : "warn"}">${b.mode === "auto" ? "Automatique, sans demande" : "Sur demande"}</span>
          <span><b>Quand :</b> ${esc(b.echeance)}</span>
          ${fraicheur(b.annee)}
          <a href="${b.lien}" target="_blank" rel="noopener">Page officielle →</a>
        </div>
      </article>`).join("")}</div>`;
  }

  function vieHtml(v) {
    if (!v) return "";
    const liste = (t, xs) => xs && xs.length ? `<div><h5>${t}</h5><ul class="small">${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
    return `
      <p class="vie-equipe"><span aria-hidden="true">🏆</span> <b>Sports :</b> ${esc(v.equipe)}</p>
      <div class="vie-grille">
        ${liste("Clubs et associations", v.clubs)}
        ${liste("Événements", v.evenements)}
        ${liste("Installations", v.installations)}
      </div>`;
  }

  /* Aides valables partout (gouvernement, fondations) pour les universitaires. */
  function aidesGenerales(niveau) {
    const ids = niveau === "uni" ? ["afe", "travail-etudes", "desjardins", "loran", "schulich", "autochtones", "mobilite-uni"] : ["afe", "fondations-cegep", "desjardins", "autochtones", "explore"];
    return `<ul class="small">${ids.map((id) => CE.AIDES.find((a) => a.id === id)).filter(Boolean)
      .map((a) => `<li><a href="${a.lien}" target="_blank" rel="noopener">${esc(a.nom)}</a> <span class="muted">· ${esc(a.montant)}</span></li>`).join("")}</ul>`;
  }

  /* Admission, résidences, stages, échanges et droits de scolarité. */
  function plusUni(u) {
    const p = (CE.UNI_PLUS || {})[u.id];
    if (!p) return "";
    const d = CE.DROITS;
    return `
      <section class="fiche-sec fiche">
        <div><h4>📅 Admission</h4><p class="small"><b>Date limite :</b> ${esc(p.dateLimite)}</p>
          <a class="small" href="${p.lienAdmission}" target="_blank" rel="noopener">Dates officielles →</a></div>
        <div><h4>🏠 Résidences</h4>${p.residence ? `<p class="small">${esc(p.residence.reservation)}</p>
          <a class="small" href="${p.residence.lien}" target="_blank" rel="noopener">Site des résidences →</a>` : '<p class="small muted">Aucune (études à distance).</p>'}</div>
        <div><h4>💼 Stages et coop</h4><p class="small">${esc(p.coop)}</p></div>
        <div><h4>✈️ Échanges</h4><p class="small">${esc(p.echanges)}</p></div>
        <div><h4>🧾 Droits de scolarité ${esc(d.annee)}</h4><p class="small">${fmt(d.parCredit, 2)} $ par crédit (tarif de base des résidents du Québec) + frais afférents : environ 1 700 $ à 2 100 $ par session à temps plein.</p>
          <a class="small" href="${d.lien}" target="_blank" rel="noopener">Source →</a></div>
      </section>`;
  }

  /* Contenu de la fiche d'une université (utilisé dans la fenêtre et dans le classement). */
  function html(u, f) {
    f = f || CE.FICHES[u.id] || {};
    return `
      <section class="fiche-sec">
        <h4>💰 Bourses de l'université</h4>
        ${boursesHtml(u)}
      </section>
      <section class="fiche-sec">
        <h4>🎉 Vie sociale et activités</h4>
        ${vieHtml(CE.VIE_SOCIALE[u.id])}
        ${f.vie ? `<p class="small muted">${esc(f.vie)}</p>` : ""}
      </section>
      ${plusUni(u)}
      ${f.taille ? `<section class="fiche-sec fiche">
        <div><h4>En bref</h4><p class="small">${esc(f.taille)}</p><p class="small"><b>Campus :</b> ${f.campus.map(esc).join(" · ")}</p></div>
        <div><h4>Points forts</h4><div class="tags">${f.forces.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div></div>
        <div><h4>Logement</h4><p class="small">${esc(f.logement)}</p></div>
        <div><h4>Autres aides, valables partout</h4>${aidesGenerales("uni")}</div>
      </section>` : ""}`;
  }

  function contenuUni(u) {
    const progs = CE.BACS.filter((b) => b.offres.some((o) => o.u === u.id));
    return {
      titre: u.nom,
      sous: `${u.ville} · ${u.langue === "fr" ? "français" : "anglais"} · ${progs.length} programmes répertoriés`,
      corps: html(u) + `
        <section class="fiche-sec"><h4>Programmes répertoriés</h4>
          <div class="tags">${progs.map((b) => {
            const o = b.offres.find((x) => x.u === u.id);
            return `<a class="tag" href="#/cegep/admissibilite?bac=${b.id}">${esc(b.nom)}${o.cote != null ? ` · ${fmt(o.cote, 1)}` : ""}</a>`;
          }).join("")}</div></section>`,
      actions: `<a class="btn small" href="${u.site}" target="_blank" rel="noopener">Site de l'admission</a>
        ${u.ville !== "À distance" ? `<a class="btn ghost small" href="#/budget?ville=${encodeURIComponent(u.ville)}">Mon budget à ${esc(u.ville)}</a>` : ""}`,
    };
  }

  function contenuCegep(c) {
    const progs = CE.DEC.filter((p) => cegepsDe(p).some((x) => x.id === c.id));
    const pl = (CE.CEGEP_PLUS || {})[c.id] || {};
    const v = Object.assign({}, CE.VIE_CEGEP, pl.equipe ? { equipe: `${pl.equipe} (ligues du RSEQ : soccer, basketball, volleyball, football ou hockey selon le cégep)` } : {});
    const ville = c.ville.split(",")[0];
    return {
      titre: c.nom,
      sous: `${c.ville} · ${c.region}${c.langue === "en" ? " · anglophone" : ""} · ${progs.length} programmes répertoriés`,
      corps: `
        <section class="fiche-sec"><h4>💰 Bourses et aides au cégep</h4>
          <ul class="small">${v.bourses.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="small muted">Les montants sont publiés par la Fondation du cégep${pl.site ? ` : <a href="${pl.site}" target="_blank" rel="noopener">site du cégep</a>` : ""}.</p>
          <p class="small">Le cégep public est gratuit : seuls des frais d'inscription et afférents (quelques centaines de dollars par session) sont exigés.</p>
          <h5>Aides valables partout</h5>${aidesGenerales("cegep")}</section>
        <section class="fiche-sec"><h4>🎉 Vie sociale et activités</h4>${vieHtml(v)}
          <p class="small muted">${pl.equipe ? "Nom d'équipe selon les ligues du RSEQ. " : ""}Clubs et événements offerts dans la plupart des cégeps ; l'offre exacte varie d'un établissement à l'autre.</p></section>
        <section class="fiche-sec"><h4>Programmes répertoriés</h4>
          <div class="tags">${progs.map((p) => `<a class="tag" href="#/secondaire/prealables?prog=${encodeURIComponent(p.code)}">${esc(p.nom)}</a>`).join("")}</div></section>`,
      actions: `${pl.site ? `<a class="btn small" href="${pl.site}" target="_blank" rel="noopener">Site du cégep</a>` : ""}
        <a class="btn ghost small" href="#/secondaire/prealables?mode=cegep&cegep=${c.id}">Programmes et préalables</a>
        <a class="btn ghost small" href="#/budget?ville=${encodeURIComponent(ville)}">Mon budget à ${esc(ville)}</a>`,
    };
  }

  let dlg = null;
  function fenetre() {
    if (dlg) return dlg;
    dlg = document.createElement("dialog");
    dlg.className = "fiche-dlg";
    dlg.setAttribute("aria-labelledby", "fiche-titre");
    document.body.appendChild(dlg);
    // Clic sur le fond ou sur un lien interne : on ferme.
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-fermer]")) dlg.close();
      else if (e.target.closest('a[href^="#/"]')) dlg.close();
    });
    return dlg;
  }

  function ouvrir(cle) {
    const [k, id] = String(cle).split(":");
    const x = k === "u" ? uni(id) : cegep(id);
    if (!x) return;
    const c = k === "u" ? contenuUni(x) : contenuCegep(x);
    const d = fenetre();
    d.innerHTML = `
      <div class="fiche-tete">
        <div><h3 id="fiche-titre">${esc(c.titre)}</h3><p class="muted small">${esc(c.sous)}</p></div>
        <button class="mode-btn" data-fermer aria-label="Fermer la fiche">✕</button>
      </div>
      <div class="fiche-corps">${c.corps}
        <p class="muted small maj">Informations vérifiées le ${dateTexte(CE.DONNEES_MAJ.verifie)}. Montants et dates indicatifs : confirme toujours sur la page officielle.</p>
      </div>
      <div class="row-actions fiche-actions">${c.actions}</div>`;
    if (!d.open) d.showModal();
    d.querySelector(".fiche-corps").scrollTop = 0;
  }

  // Un seul écouteur pour tout le site : n'importe quel élément data-fiche ouvre la fiche.
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-fiche]");
    if (!el) return;
    e.preventDefault();
    ouvrir(el.dataset.fiche);
  });
  window.addEventListener("hashchange", () => { if (dlg && dlg.open) dlg.close(); });

  /* Lien cliquable vers la fiche d'une école. */
  const lien = (cle, texte, cls = "") => `<button type="button" class="lien-fiche ${cls}" data-fiche="${cle}" title="Voir la fiche : bourses, vie sociale, programmes">${esc(texte)}</button>`;

  window.FICHE = { html, ouvrir, lien, dateTexte };
})();
