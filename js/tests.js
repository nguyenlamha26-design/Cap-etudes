/* Moteur de questionnaire paginé + calcul des profils. */
(function () {
  const { esc, store } = UI;
  const PAR_PAGE = 6;

  /* Affiche un questionnaire dans `el`. Les réponses sont gardées dans le navigateur. */
  function questionnaire(el, { cle, questions, echelle, onFini }) {
    let rep = store.get(cle + ":rep", {});
    let pageNo = 0;
    const nbPages = Math.ceil(questions.length / PAR_PAGE);

    function rendre() {
      const debut = pageNo * PAR_PAGE;
      const lot = questions.slice(debut, debut + PAR_PAGE);
      const faites = Object.keys(rep).length;
      const pageComplete = lot.every((_, i) => rep[debut + i] != null);
      el.innerHTML = `
        <div class="quiz">
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${faites}">
            <div style="width:${(faites / questions.length) * 100}%"></div>
          </div>
          <p class="muted small">Page ${pageNo + 1} sur ${nbPages} · ${faites}/${questions.length} réponses</p>
          ${lot.map((q, i) => {
            const n = debut + i;
            return `
            <fieldset class="question">
              <legend><span class="qnum">${n + 1}.</span> ${esc(q.q)}</legend>
              <div class="likert">
                ${echelle.map((lab, v) => `
                  <label class="${rep[n] === v + 1 ? "on" : ""}">
                    <input type="radio" name="q${n}" value="${v + 1}" ${rep[n] === v + 1 ? "checked" : ""}>
                    <span class="dot">${v + 1}</span><span class="lab">${esc(lab)}</span>
                  </label>`).join("")}
              </div>
            </fieldset>`;
          }).join("")}
          <div class="quiz-nav">
            <button class="btn ghost" data-act="prec" ${pageNo === 0 ? "disabled" : ""}>Précédent</button>
            ${pageNo < nbPages - 1
              ? `<button class="btn" data-act="suiv" ${pageComplete ? "" : "disabled"}>Suivant</button>`
              : `<button class="btn" data-act="fin" ${faites === questions.length ? "" : "disabled"}>Voir mes résultats</button>`}
          </div>
        </div>`;
    }

    el.onchange = (e) => {
      const m = e.target.name && e.target.name.match(/^q(\d+)$/);
      if (!m) return;
      rep[m[1]] = Number(e.target.value);
      store.set(cle + ":rep", rep);
      const y = window.scrollY;
      rendre();
      window.scrollTo(0, y);
    };
    el.onclick = (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (!act) return;
      if (act === "prec") pageNo--;
      if (act === "suiv") pageNo++;
      if (act === "fin") { store.set(cle + ":fini", true); onFini(rep); return; }
      rendre();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    rendre();
  }

  /* Pourcentage 0–100 par type à partir des réponses 1–5. */
  function scores(questions, rep, types) {
    const res = {};
    types.forEach((t) => {
      const items = questions.map((q, i) => ({ q, i })).filter((x) => x.q.t === t);
      const somme = items.reduce((s, x) => {
        const v = rep[x.i] || 3;
        return s + (x.q.r ? 6 - v : v);
      }, 0);
      res[t] = Math.round(((somme - items.length) / (items.length * 4)) * 100);
    });
    return res;
  }

  /* Adéquation 0–100 d'un code RIASEC de programme avec le profil. */
  function adequation(code, profil) {
    if (!code) return 0;
    const poids = [3, 2, 1];
    let s = 0, w = 0;
    [...code].forEach((l, i) => { s += (profil[l] || 0) * poids[i]; w += poids[i]; });
    return Math.round(s / w);
  }

  function codeHolland(profil) {
    return Object.entries(profil).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]).join("");
  }

  function barres(profil, libelles) {
    const tri = Object.entries(profil).sort((a, b) => b[1] - a[1]);
    return `<div class="bars">${tri.map(([k, v]) => `
      <div class="bar-row">
        <span class="bar-lab">${esc(libelles[k])}</span>
        <span class="bar"><span style="width:${v}%"></span></span>
        <span class="bar-val">${v}</span>
      </div>`).join("")}</div>`;
  }

  window.TESTS = { questionnaire, scores, adequation, codeHolland, barres };
})();
