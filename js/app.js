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
      </div>
      <h2 class="section-titre">Pour tout le monde</h2>
      <div class="cards">
        <a class="card" href="#/demarches"><span class="card-ico" aria-hidden="true">📅</span><h2>Dates et démarches</h2>
          <p>Le calendrier d'admission de cette année, la prochaine date à ne pas manquer et ta liste de documents.</p></a>
        <a class="card" href="#/budget"><span class="card-ico" aria-hidden="true">💰</span><h2>Budget loin de chez soi</h2>
          <p>Loyer, épicerie, retours à la maison, frais de scolarité : combien coûte une année d'études dans une autre ville ?</p></a>
        <a class="card" href="#/recherche"><span class="card-ico" aria-hidden="true">🔎</span><h2>Écoles, bourses et aides</h2>
          <p>Cherche dans les fiches des universités et des cégeps, les bourses d'admission, l'aide financière et les emplois étudiants.</p></a>
        <a class="card" href="#/compte"><span class="card-ico" aria-hidden="true">👤</span><h2>Mon compte</h2>
          <p>Connecte-toi pour retrouver tes résultats, ta cote R et ton budget sur tous tes appareils.</p></a>
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
    "/budget": BUDGET.budget,
    "/recherche": RECHERCHE.recherche,
    "/demarches": DEMARCHES.demarches,
    "/compte": COMPTE.vue,
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
    { id: "pastel", nom: "Pastel", c: ["#f9a8d4", "#a5b4fc", "#99f6e4"] },
  ];
  const btn = document.getElementById("theme-btn");
  const menu = document.getElementById("theme-menu");
  const modeBtn = document.getElementById("mode-btn");
  const racine = document.documentElement;

  function appliquerTheme(id) {
    if (!THEMES.some((t) => t.id === id)) id = "aurore";
    racine.dataset.theme = id;
    UI.store.set("theme", id);
    menu.querySelectorAll(".theme-opt").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.choix === id)));
  }

  /* ---------- Mode clair / sombre / auto (suit l'appareil) ---------- */
  const ICONES = {
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>',
  };
  const mq = window.matchMedia ? matchMedia("(prefers-color-scheme: light)") : null;
  let prefMode = UI.store.get("mode", "auto");
  const modeEffectif = () => (prefMode === "auto" ? (mq && mq.matches ? "light" : "dark") : prefMode);

  function appliquerMode(pref, anime) {
    prefMode = ["light", "dark", "auto"].includes(pref) ? pref : "auto";
    UI.store.set("mode", prefMode);
    if (anime) { racine.classList.add("mode-anim"); setTimeout(() => racine.classList.remove("mode-anim"), 450); }
    const m = modeEffectif();
    racine.dataset.mode = m;
    // Le bouton montre le mode vers lequel il bascule.
    const cible = m === "dark" ? "light" : "dark";
    modeBtn.innerHTML = ICONES[cible];
    const libelle = cible === "light" ? "Passer en mode clair" : "Passer en mode sombre";
    modeBtn.title = libelle; modeBtn.setAttribute("aria-label", libelle);
    menu.querySelectorAll(".mode-seg button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.choix === prefMode)));
  }
  modeBtn.onclick = () => appliquerMode(modeEffectif() === "dark" ? "light" : "dark", true);
  if (mq) mq.addEventListener("change", () => { if (prefMode === "auto") appliquerMode("auto", true); });

  menu.innerHTML = `
    <p>Luminosité</p>
    <div class="mode-seg" role="radiogroup" aria-label="Luminosité">
      <button role="radio" data-choix="light" aria-checked="false">Clair</button>
      <button role="radio" data-choix="dark" aria-checked="false">Sombre</button>
      <button role="radio" data-choix="auto" aria-checked="false" title="Suit le réglage de ton appareil">Auto</button>
    </div>
    <hr>
    <p>Thème de couleurs</p>
    <div role="radiogroup" aria-label="Thème de couleurs" class="theme-list">` + THEMES.map((t) => `
      <button class="theme-opt" role="radio" data-choix="${t.id}" aria-checked="false">
        <span class="sw" style="background:conic-gradient(${t.c[0]},${t.c[1]},${t.c[2]},${t.c[0]})"></span>${t.nom}
      </button>`).join("") + `</div>`;
  const ouvrir = (o) => { menu.hidden = !o; btn.setAttribute("aria-expanded", String(o)); };
  btn.onclick = (e) => { e.stopPropagation(); ouvrir(menu.hidden); if (!menu.hidden) menu.querySelector('.theme-opt[aria-checked="true"]')?.focus(); };
  menu.onclick = (e) => {
    const o = e.target.closest(".theme-opt"); if (o) appliquerTheme(o.dataset.choix);
    const m = e.target.closest(".mode-seg button"); if (m) appliquerMode(m.dataset.choix, true);
  };
  menu.onkeydown = (e) => {
    const opts = [...menu.querySelectorAll(".theme-opt")];
    const i = opts.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = opts[(i + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length];
      n.focus(); appliquerTheme(n.dataset.choix);
    }
    if (e.key === "Escape") { ouvrir(false); btn.focus(); }
  };
  document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest(".theme-picker")) ouvrir(false); });
  appliquerTheme(racine.dataset.theme);
  appliquerMode(prefMode, false);

  window.addEventListener("hashchange", () => { ouvrir(false); naviguer(); });
  naviguer();
})();
