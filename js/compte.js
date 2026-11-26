/* Connexion (Supabase Auth par l'API REST, sans bibliothèque) et synchronisation des données du site.
 * Sans configuration, la page « Mon compte » propose un code de transfert entre appareils. */
(function () {
  const { esc, store, page } = UI;
  const CFG = window.SB_CONFIG || {};
  const ACTIF = Boolean(CFG.url && CFG.key);
  const CLE_SESSION = "capetudes-auth";   // hors du préfixe « capetudes: » : jamais synchronisée
  const CLE_MAJ = "capetudes-maj";
  const PREFIXE = "capetudes:";

  let session = lireSession();
  let etatSync = "";          // texte affiché sur la page du compte
  let minuterie = null;
  let enApplication = false;  // vrai pendant qu'on écrit les données reçues du serveur

  function lireSession() { try { return JSON.parse(localStorage.getItem(CLE_SESSION)); } catch { return null; } }
  function ecrireSession(s) {
    session = s;
    if (s) localStorage.setItem(CLE_SESSION, JSON.stringify(s)); else localStorage.removeItem(CLE_SESSION);
    majBouton();
  }

  /* ---------- API ---------- */
  async function api(chemin, { methode = "GET", corps, auth = true, entetes = {} } = {}) {
    const h = { apikey: CFG.key, "Content-Type": "application/json", ...entetes };
    if (auth && session) h.Authorization = "Bearer " + session.access_token;
    const r = await fetch(CFG.url.replace(/\/$/, "") + chemin, { method: methode, headers: h, body: corps ? JSON.stringify(corps) : undefined });
    const texte = await r.text();
    let json = null; try { json = texte ? JSON.parse(texte) : null; } catch { /* réponse vide */ }
    if (!r.ok) {
      const msg = (json && (json.msg || json.error_description || json.message || json.error)) || `Erreur ${r.status}`;
      throw new Error(traduire(msg));
    }
    return json;
  }

  function traduire(m) {
    const t = {
      "Invalid login credentials": "Courriel ou mot de passe incorrect.",
      "Email not confirmed": "Confirme d'abord ton adresse avec le lien reçu par courriel.",
      "User already registered": "Un compte existe déjà avec ce courriel. Connecte-toi.",
      "Password should be at least 6 characters.": "Le mot de passe doit contenir au moins 6 caractères.",
    };
    if (/rate limit/i.test(m)) return "Trop de tentatives : réessaie dans quelques minutes.";
    if (/relation .*profils.* does not exist|Could not find the table/i.test(m)) return "La table des profils n'existe pas encore : exécute orientation/supabase.sql dans Supabase.";
    return t[m] || m;
  }

  function avecExpiration(s) { return Object.assign({}, s, { expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600) }); }

  async function sessionValide() {
    if (!session) return null;
    if (session.expires_at - 60 > Date.now() / 1000) return session;
    try {
      const s = await api("/auth/v1/token?grant_type=refresh_token", { methode: "POST", auth: false, corps: { refresh_token: session.refresh_token } });
      ecrireSession(avecExpiration(s));
    } catch { ecrireSession(null); }
    return session;
  }

  /* ---------- Données locales ---------- */
  function instantane() {
    const d = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIXE)) d[k.slice(PREFIXE.length)] = localStorage.getItem(k);
    }
    return d;
  }
  function appliquer(d) {
    enApplication = true;
    Object.keys(instantane()).forEach((k) => localStorage.removeItem(PREFIXE + k));
    Object.entries(d || {}).forEach(([k, v]) => typeof v === "string" && localStorage.setItem(PREFIXE + k, v));
    enApplication = false;
  }

  /* Appelé par UI.store à chaque modification. */
  function modifie() {
    if (enApplication) return;
    localStorage.setItem(CLE_MAJ, new Date().toISOString());
    if (ACTIF && session) { clearTimeout(minuterie); minuterie = setTimeout(pousser, 1500); }
  }

  async function pousser() {
    if (!(await sessionValide())) return;
    try {
      await api("/rest/v1/profils?on_conflict=user_id", {
        methode: "POST", entetes: { Prefer: "resolution=merge-duplicates,return=minimal" },
        corps: { user_id: session.user.id, prenom: prenom() || null, donnees: instantane(), maj: localStorage.getItem(CLE_MAJ) || new Date().toISOString() },
      });
      etatSync = "Synchronisé à " + new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { etatSync = "Synchronisation impossible : " + e.message; }
    rafraichirEtat();
  }

  /* À la connexion : on garde la version la plus récente (serveur ou appareil). */
  async function synchroniser() {
    if (!(await sessionValide())) return;
    try {
      const lignes = await api(`/rest/v1/profils?user_id=eq.${encodeURIComponent(session.user.id)}&select=donnees,maj,prenom`);
      const distant = lignes && lignes[0];
      const local = localStorage.getItem(CLE_MAJ);
      if (distant && (!local || new Date(distant.maj) > new Date(local))) {
        appliquer(distant.donnees);
        localStorage.setItem(CLE_MAJ, distant.maj);
        etatSync = "Tes données ont été récupérées de ton compte.";
        window.dispatchEvent(new HashChangeEvent("hashchange"));  // réaffiche la page avec les données reçues
      } else {
        await pousser();
      }
    } catch (e) { etatSync = "Synchronisation impossible : " + e.message; }
    rafraichirEtat();
  }

  /* Adresse où revenir après le lien reçu par courriel (doit être autorisée dans Supabase › Authentication › URL Configuration). */
  const retour = () => location.origin + location.pathname;

  const prenom = () => (session && session.user && session.user.user_metadata && session.user.user_metadata.prenom) || "";

  /* ---------- Bouton de la barre du haut ---------- */
  function majBouton() {
    const b = document.getElementById("account-btn");
    if (!b) return;
    if (session) {
      const nom = prenom() || session.user.email;
      b.innerHTML = `<span class="avatar">${esc(nom.trim().charAt(0).toUpperCase())}</span>`;
      b.title = "Mon compte (" + nom + ")";
    } else {
      b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`;
      b.title = "Connexion";
    }
    b.setAttribute("aria-label", b.title);
  }
  function rafraichirEtat() { const e = document.getElementById("sync-etat"); if (e) e.textContent = etatSync; }

  /* ---------- Page « Mon compte » ---------- */
  function vue(app) {
    const contenu = !ACTIF ? `
      <div class="panel"><p>Les comptes en ligne ne sont pas activés sur ce site. Tes résultats restent dans ce navigateur.</p>
      <p class="small muted">Pour les activer : crée un projet Supabase, exécute <code>orientation/supabase.sql</code> et inscris l'adresse et la clé publique dans <code>orientation/js/config.js</code>.</p></div>
      ${transfert()}`
      : session ? connecte() : formulaires();

    app.innerHTML = page({
      titre: session ? "Mon compte" : "Connexion",
      intro: session ? "" : "Crée un compte pour retrouver tes résultats de tests, tes notes, ta cote R et ton budget sur tous tes appareils.",
      retour: { href: "#/", label: "Accueil" },
      contenu,
    });
    brancher(app);
  }

  function formulaires() {
    return `
      <div class="seg" role="tablist" id="onglets">
        <button class="on" data-o="connexion">Se connecter</button>
        <button data-o="inscription">Créer un compte</button>
      </div>
      <div class="grid2">
        <form class="panel form auth" id="f-auth" novalidate>
          <label id="l-prenom" hidden>Prénom <input name="prenom" autocomplete="given-name" maxlength="40"></label>
          <label>Courriel <input name="email" type="email" autocomplete="email" required></label>
          <label>Mot de passe <input name="mdp" type="password" autocomplete="current-password" minlength="6" required>
            <span class="hint" id="h-mdp" hidden>Au moins 6 caractères.</span></label>
          <button class="btn" type="submit" id="b-auth">Se connecter</button>
          <button class="lien" type="button" id="b-oubli">Mot de passe oublié ?</button>
          <p class="msg" id="msg" role="status" aria-live="polite"></p>
        </form>
        <div class="panel">
          <h2 class="h3">Pourquoi un compte ?</h2>
          <ul class="small">
            <li>Tes résultats aux tests d'intérêts et de personnalité</li>
            <li>Tes notes, ta cote R et ta prévision</li>
            <li>Tes critères de classement et ton budget</li>
          </ul>
          <p class="small muted">Personne d'autre que toi ne peut lire tes données. Tu peux supprimer tes données en ligne à tout moment.</p>
        </div>
      </div>
      ${transfert()}`;
  }

  function connecte() {
    return `
      <div class="panel compte">
        <div class="avatar grand">${esc((prenom() || session.user.email).charAt(0).toUpperCase())}</div>
        <div>
          <h2 class="h3">${esc(prenom() || "Bonjour !")}</h2>
          <p class="muted small">${esc(session.user.email)}</p>
          <p class="small" id="sync-etat">${esc(etatSync)}</p>
        </div>
        <div class="row-actions">
          <button class="btn" id="b-sync">Synchroniser maintenant</button>
          <button class="btn ghost" id="b-mdp">Changer mon mot de passe</button>
          <button class="btn ghost" id="b-deco">Se déconnecter</button>
          <button class="btn ghost danger" id="b-effacer">Effacer mes données en ligne</button>
        </div>
      </div>
      ${transfert()}`;
  }

  function transfert() {
    return `
      <details class="panel"><summary>Transférer mes données sans compte</summary>
        <p class="small">Copie ce code sur ton autre appareil, dans la même section, puis clique « Importer ».</p>
        <textarea id="code" rows="3" readonly></textarea>
        <div class="row-actions">
          <button class="btn ghost small" id="b-copier">Copier mon code</button>
          <button class="btn ghost small" id="b-importer">Importer un code</button>
        </div>
        <p class="msg small" id="msg-code" role="status" aria-live="polite"></p>
      </details>`;
  }

  function brancher(app) {
    const $ = (s) => app.querySelector(s);
    // Transfert par code
    const code = $("#code");
    if (code) {
      code.value = btoa(unescape(encodeURIComponent(JSON.stringify(instantane()))));
      $("#b-copier").onclick = async () => {
        try { await navigator.clipboard.writeText(code.value); $("#msg-code").textContent = "Code copié."; }
        catch { code.select(); $("#msg-code").textContent = "Sélectionne le code et copie-le."; }
      };
      $("#b-importer").onclick = () => {
        const v = prompt("Colle ici le code de ton autre appareil :");
        if (!v) return;
        try {
          const d = JSON.parse(decodeURIComponent(escape(atob(v.trim()))));
          if (typeof d !== "object" || Array.isArray(d)) throw new Error();
          appliquer(d); modifie();
          $("#msg-code").textContent = "Données importées.";
          code.value = v.trim();
        } catch { $("#msg-code").textContent = "Ce code n'est pas valide."; }
      };
    }
    if (!ACTIF) return;

    if (session) {
      $("#b-sync").onclick = () => { etatSync = "Synchronisation…"; rafraichirEtat(); synchroniser(); };
      $("#b-mdp").onclick = async () => {
        const mdp = prompt("Nouveau mot de passe (au moins 6 caractères) :");
        if (mdp == null) return;
        if (mdp.length < 6) { etatSync = "Le mot de passe doit contenir au moins 6 caractères."; return rafraichirEtat(); }
        try { await sessionValide(); await api("/auth/v1/user", { methode: "PUT", corps: { password: mdp } }); etatSync = "Mot de passe changé."; }
        catch (e) { etatSync = "Impossible de changer le mot de passe : " + e.message; }
        rafraichirEtat();
      };
      $("#b-deco").onclick = async () => {
        clearTimeout(minuterie);
        try { await api("/auth/v1/logout", { methode: "POST" }); } catch { /* session déjà expirée */ }
        ecrireSession(null); etatSync = ""; vue(app);
      };
      $("#b-effacer").onclick = async () => {
        if (!confirm("Effacer définitivement tes données enregistrées en ligne ? Celles de cet appareil sont conservées.")) return;
        try {
          await sessionValide();
          await api(`/rest/v1/profils?user_id=eq.${encodeURIComponent(session.user.id)}`, { methode: "DELETE" });
          etatSync = "Données en ligne effacées.";
        } catch (e) { etatSync = "Impossible d'effacer : " + e.message; }
        rafraichirEtat();
      };
      return;
    }

    let mode = "connexion";
    const f = $("#f-auth"), msg = $("#msg");
    $("#onglets").onclick = (e) => {
      const o = e.target.dataset.o; if (!o) return;
      mode = o;
      app.querySelectorAll("#onglets button").forEach((b) => b.classList.toggle("on", b.dataset.o === o));
      $("#l-prenom").hidden = o !== "inscription";
      $("#h-mdp").hidden = o !== "inscription";
      f.mdp.autocomplete = o === "inscription" ? "new-password" : "current-password";
      $("#b-auth").textContent = o === "inscription" ? "Créer mon compte" : "Se connecter";
      msg.textContent = ""; msg.className = "msg";
    };
    const afficher = (t, ok) => { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "ko"); };

    f.onsubmit = async (e) => {
      e.preventDefault();
      const email = f.email.value.trim(), mdp = f.mdp.value;
      if (!/^\S+@\S+\.\S+$/.test(email)) return afficher("Entre une adresse courriel valide.");
      if (mdp.length < 6) return afficher("Le mot de passe doit contenir au moins 6 caractères.");
      $("#b-auth").disabled = true;
      try {
        if (mode === "inscription") {
          const r = await api("/auth/v1/signup?redirect_to=" + encodeURIComponent(retour()), { methode: "POST", auth: false, corps: { email, password: mdp, data: { prenom: f.prenom.value.trim() } } });
          if (r && r.access_token) { ecrireSession(avecExpiration(r)); await synchroniser(); vue(document.getElementById("app")); return; }
          afficher("Compte créé ! Ouvre le lien reçu par courriel pour confirmer ton adresse, puis connecte-toi.", true);
        } else {
          const r = await api("/auth/v1/token?grant_type=password", { methode: "POST", auth: false, corps: { email, password: mdp } });
          ecrireSession(avecExpiration(r));
          etatSync = "Connexion réussie.";
          vue(document.getElementById("app"));
          await synchroniser();
        }
      } catch (err) { afficher(err.message); }
      finally { const b = document.getElementById("b-auth"); if (b) b.disabled = false; }
    };
    $("#b-oubli").onclick = async () => {
      const email = f.email.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return afficher("Entre d'abord ton courriel, puis clique « Mot de passe oublié ? ».");
      try {
        await api("/auth/v1/recover?redirect_to=" + encodeURIComponent(retour()), { methode: "POST", auth: false, corps: { email } });
        afficher("Si un compte existe, un courriel de réinitialisation vient d'être envoyé.", true);
      } catch (err) { afficher(err.message); }
    };
  }

  /* Retour d'un lien de confirmation ou de réinitialisation : la session arrive dans l'adresse (#access_token=…). */
  function lireRetourCourriel() {
    if (!ACTIF || !location.hash.includes("access_token=")) return;
    const p = new URLSearchParams(location.hash.slice(1));
    const s = { access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_in: Number(p.get("expires_in")) || 3600 };
    history.replaceState(null, "", location.pathname + "#/compte");
    fetch(CFG.url.replace(/\/$/, "") + "/auth/v1/user", { headers: { apikey: CFG.key, Authorization: "Bearer " + s.access_token } })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (!user) return;
        ecrireSession(avecExpiration(Object.assign(s, { user })));
        etatSync = p.get("type") === "recovery" ? "Connexion réussie. Choisis maintenant un nouveau mot de passe." : "Adresse confirmée : connexion réussie.";
        synchroniser();
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
  }

  lireRetourCourriel();
  majBouton();
  if (ACTIF && session) sessionValide();

  window.COMPTE = { vue, modifie, actif: ACTIF };
})();
