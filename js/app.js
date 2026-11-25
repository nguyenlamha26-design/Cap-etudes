/* Routeur à base de « #/chemin?param=valeur » et page d'accueil. */
(function () {
  const app = document.getElementById("app");

  function accueil() {
    app.innerHTML = `
      <section class="hero">
        <h1>Ton prochain pas, sans te perdre.</h1>
        <p>Des outils gratuits pour choisir ton programme au cégep ou à l'université au Québec : tests, parcours, préalables, cote R et comparaison des universités.</p>
      </section>
      <div class="choices">
        <a class="choice sec" href="#/secondaire">
          <span class="choice-kicker">Je sors du</span>
          <span class="choice-title">Secondaire</span>
          <ul><li>Test d'intérêts</li><li>Test de personnalité</li><li>Parcours possibles</li><li>Préalables par cégep</li></ul>
          <span class="btn">Commencer</span>
        </a>
        <a class="choice ceg" href="#/cegep">
          <span class="choice-kicker">Je sors du</span>
          <span class="choice-title">Cégep</span>
          <ul><li>Calculateur de cote R</li><li>Prévision de cote R</li><li>Test d'intérêts universitaire</li><li>Où aller avec ma cote R</li><li>Classement des universités</li></ul>
          <span class="btn">Commencer</span>
        </a>
      </div>`;
  }

  const ROUTES = {
    "/": accueil,
    "/secondaire": SECONDAIRE.accueil,
    "/secondaire/interets": SECONDAIRE.interets,
    "/secondaire/personnalite": SECONDAIRE.personnalite,
    "/secondaire/parcours": SECONDAIRE.parcours,
    "/secondaire/prealables": SECONDAIRE.prealables,
    "/cegep": CEGEP.accueil,
    "/cegep/cote-r": CEGEP.coteR,
    "/cegep/prevision": CEGEP.prevision,
    "/cegep/interets": CEGEP.interets,
    "/cegep/admissibilite": CEGEP.admissibilite,
    "/cegep/classement": CEGEP.classement,
  };

  let dernier = null;
  function naviguer() {
    const brut = location.hash.replace(/^#/, "") || "/";
    const [chemin, qs] = brut.split("?");
    const vue = ROUTES[chemin] || accueil;
    const params = new URLSearchParams(qs || "");
    vue(app, params);
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("on", chemin.startsWith("/" + a.dataset.nav)));
    // Ne remonte en haut qu'en changeant de page (pas en changeant un filtre de la même page).
    if (chemin !== dernier) { window.scrollTo(0, 0); app.focus({ preventScroll: true }); }
    dernier = chemin;
    const h1 = app.querySelector("h1");
    document.title = (h1 && chemin !== "/" ? h1.textContent.trim() + " · " : "") + "Cap Études";
  }

  /* ---------- Thèmes ---------- */
  const THEMES = [
    { id: "aurore", nom: "Aurore", c: ["#7c3aed", "#06b6d4", "#ec4899"] },
    { id: "ocean", nom: "Océan", c: ["#0284c7", "#14b8a6", "#4f46e5"] },
    { id: "coucher", nom: "Coucher de soleil", c: ["#f97316", "#e11d48", "#a855f7"] },
    { id: "foret", nom: "Forêt", c: ["#16a34a", "#0d9488", "#65a30d"] },
    { id: "nuit", nom: "Minuit", c: ["#3730a3", "#475569", "#1e3a8a"] },
    { id: "pastel", nom: "Pastel (clair)", c: ["#f9a8d4", "#a5b4fc", "#99f6e4"] },
  ];
  const btn = document.getElementById("theme-btn");
  const menu = document.getElementById("theme-menu");

  function appliquerTheme(id) {
    if (!THEMES.some((t) => t.id === id)) id = "aurore";
    document.documentElement.dataset.theme = id;
    UI.store.set("theme", id);
    menu.querySelectorAll(".theme-opt").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.theme === id)));
  }
  menu.innerHTML = `<p>Thème de couleurs</p>` + THEMES.map((t) => `
    <button class="theme-opt" role="radio" data-theme="${t.id}" aria-checked="false">
      <span class="sw" style="background:conic-gradient(${t.c[0]},${t.c[1]},${t.c[2]},${t.c[0]})"></span>${t.nom}
    </button>`).join("");
  const ouvrir = (o) => { menu.hidden = !o; btn.setAttribute("aria-expanded", String(o)); };
  btn.onclick = (e) => { e.stopPropagation(); ouvrir(menu.hidden); if (!menu.hidden) menu.querySelector('[aria-checked="true"]')?.focus(); };
  menu.onclick = (e) => { const o = e.target.closest(".theme-opt"); if (o) appliquerTheme(o.dataset.theme); };
  menu.onkeydown = (e) => {
    const opts = [...menu.querySelectorAll(".theme-opt")];
    const i = opts.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = opts[(i + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length];
      n.focus(); appliquerTheme(n.dataset.theme);
    }
    if (e.key === "Escape") { ouvrir(false); btn.focus(); }
  };
  document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest(".theme-picker")) ouvrir(false); });
  appliquerTheme(document.documentElement.dataset.theme);

  window.addEventListener("hashchange", () => { ouvrir(false); naviguer(); });
  naviguer();
})();
