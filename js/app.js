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

  window.addEventListener("hashchange", naviguer);
  naviguer();
})();
