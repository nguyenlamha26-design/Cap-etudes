/* Utilitaires communs : échappement, stockage local, formats, recherches dans les données. */
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const store = {
    get(k, def) {
      try { const v = localStorage.getItem("capetudes:" + k); return v == null ? def : JSON.parse(v); } catch { return def; }
    },
    set(k, v) { try { localStorage.setItem("capetudes:" + k, JSON.stringify(v)); } catch { /* stockage plein ou bloqué */ } if (window.COMPTE) COMPTE.modifie(); },
    del(k) { try { localStorage.removeItem("capetudes:" + k); } catch { /* rien */ } if (window.COMPTE) COMPTE.modifie(); },
  };

  const nf = (d) => new Intl.NumberFormat("fr-CA", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmt = (n, d = 1) => (n == null || !isFinite(n) ? "—" : nf(d).format(n));
  /* Accepte « 27,5 » et « 27.5 ». */
  const num = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".").trim()); return isFinite(n) ? n : null; };

  const dec = (code) => CE.DEC.find((p) => p.code === code);
  const bac = (id) => CE.BACS.find((b) => b.id === id);
  const uni = (id) => CE.UNIVERSITES.find((u) => u.id === id);
  const cegep = (id) => CE.CEGEPS.find((c) => c.id === id);
  const decCode = (p) => p.codeAffiche || p.code;

  /* Cégeps qui offrent un programme (liste indicative). */
  const cegepsDe = (p) => p.partout
    ? CE.CEGEPS.filter((c) => !CE.CEGEPS_SPECIALISES.includes(c.id))
    : (p.cegeps || []).map(cegep).filter(Boolean);

  const prealablesTexte = (p) => {
    if (!p.prealables.length) return ["Aucun préalable particulier (DES)"];
    return p.prealables.map((x) => Array.isArray(x) ? x.map((y) => CE.PREALABLES[y]).join(" ou ") : CE.PREALABLES[x]);
  };

  /* Vérifie les préalables d'un programme selon les cours réussis (ensemble de codes). */
  const ORDRE_MATH = { CST4: 1, TSSN4: 2, CST5: 2, TSSN5: 3 };
  function satisfait(code, acquis) {
    if (acquis.has(code)) return true;
    // TS/SN 5e couvre tout ; TS/SN 4e couvre CST 4e ; CST 5e couvre CST 4e.
    if (code === "CST4") return ["TSSN4", "CST5", "TSSN5"].some((c) => acquis.has(c));
    if (code === "TSSN4") return acquis.has("TSSN5");
    if (code === "CST5") return false;
    return false;
  }
  function manquants(p, acquis) {
    return p.prealables.filter((x) => Array.isArray(x) ? !x.some((y) => satisfait(y, acquis)) : !satisfait(x, acquis))
      .map((x) => Array.isArray(x) ? x.map((y) => CE.PREALABLES[y]).join(" ou ") : CE.PREALABLES[x]);
  }

  const typeLabel = { preu: "Préuniversitaire · 2 ans", tech: "Technique · 3 ans", tremplin: "Tremplin DEC" };

  function page({ titre, intro, retour, contenu }) {
    return `
      <section class="page">
        ${retour ? `<a class="retour" href="${retour.href}">← ${esc(retour.label)}</a>` : ""}
        <h1>${titre}</h1>
        ${intro ? `<p class="intro">${intro}</p>` : ""}
        ${contenu}
      </section>`;
  }

  function debounce(fn, ms = 120) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  window.UI = { esc, store, fmt, num, dec, bac, uni, cegep, decCode, cegepsDe, prealablesTexte, manquants, satisfait, typeLabel, page, debounce, ORDRE_MATH };
})();
