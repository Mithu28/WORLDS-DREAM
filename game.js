"use strict";

/* =====================================================
   WORLDS-DREAM : game.js
   1. Outils          5. Draft (carte)
   2. Config / état   6. Tournoi (poules, bracket)
   3. Menu            7. Match animé (suspense)
   4. Carte SVG       8. Écran final
   ===================================================== */

/* ---------- 1. OUTILS ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const oneOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const chip = (tag, color) => {
  const c = el("span", "chip", tag);
  c.style.background = color;
  return c;
};

/* ---------- 2. CONFIG / ÉTAT ---------- */
const CFG = {
  K: 26,                                   // plus grand = résultats plus aléatoires
  REROLLS: 3,                              // rerolls par joueur (mode 3 équipes)
  SYN: { 1: 0, 2: 3, 3: 7, 4: 12, 5: 18 } // bonus de synergie (même équipe)
};
const HCOL = ["#1ad8ff", "#ff2e93"];       // couleurs joueur 1 / joueur 2
const ORDER = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1]; // ordre de draft (snake)
const ROLE_ID = ROLES.map((r) => r.id);
const LANE_LABEL = { TOP: "top", MID: "mid", BOT: "bot" };
const STAGE_LABEL = {
  groups: "PHASE DE GROUPES",
  qf: "QUARTS DE FINALE",
  sf: "DEMI-FINALES",
  f: "FINALE",
  done: "CHAMPIONS"
};
const REACH_LABEL = [
  "Éliminé en phase de groupes",
  "Éliminé en quarts de finale",
  "Éliminé en demi-finale",
  "Finaliste",
  "CHAMPION DU MONDE"
];

// Tous les joueurs à plat
const ALL = [];
TEAMS.forEach((t) =>
  ROLES.forEach((r) => {
    const [name, rating] = t.players[r.id];
    ALL.push({
      id: t.tag + "-" + r.id, name, rating,
      team: t.tag, teamName: t.name, color: t.color, role: r.id
    });
  })
);

const S = {
  mode: "three", opp: "local", diff: "normal",
  names: ["Joueur 1", "Joueur 2"], speed: 1
};
let D = null; // état de la draft
let T = null; // état du tournoi
let M = null; // état du match animé

function showScreen(id, label) {
  $$(".screen").forEach((s) => s.classList.add("hidden"));
  $("#" + id).classList.remove("hidden");
  const unit = (label + "   ·   ").repeat(8);
  $("#marq").innerHTML = "<span>" + unit + "</span><span>" + unit + "</span>";
  window.scrollTo(0, 0);
}

function powerOf(roster) {
  const ps = Object.values(roster);
  const sum = ps.reduce((a, p) => a + p.rating, 0);
  const cnt = {};
  ps.forEach((p) => (cnt[p.team] = (cnt[p.team] || 0) + 1));
  const syn = Object.values(cnt).reduce((a, c) => a + CFG.SYN[c], 0);
  return { sum, syn, power: (sum + syn) / 5 };
}
const winProb = (pa, pb) => 1 / (1 + Math.pow(10, -(pa - pb) / CFG.K));

/* ---------- 3. MENU ---------- */
$$("[data-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    S.mode = b.dataset.mode;
    $$("[data-mode]").forEach((x) => x.classList.toggle("sel", x === b));
  })
);
$$("[data-opp]").forEach((b) =>
  b.addEventListener("click", () => {
    S.opp = b.dataset.opp;
    $$("[data-opp]").forEach((x) => x.classList.toggle("sel", x === b));
    $("#aiOpts").classList.toggle("hidden", S.opp !== "ai");
    $("#n2").classList.toggle("hidden", S.opp === "ai");
  })
);
$("#start").addEventListener("click", () => {
  S.diff = $("#diff").value;
  S.names = [
    $("#n1").value.trim() || "Joueur 1",
    S.opp === "ai" ? "Programme" : $("#n2").value.trim() || "Joueur 2"
  ];
  startDraft();
});
$("#replay").addEventListener("click", () => startDraft());
$("#toMenu").addEventListener("click", () => showScreen("menu", "WORLDS-DREAM"));
showScreen("menu", "WORLDS-DREAM");

/* ---------- 4. CARTE SVG ---------- */
const NS = "http://www.w3.org/2000/svg";
const PT = {
  drake: [420, 415],
  baron: [180, 185],
  lane: { TOP: [110, 110], MID: [300, 300], BOT: [490, 490] }
};
const TOWER = {
  A: { TOP: [70, 300], MID: [235, 365], BOT: [300, 530] },
  B: { TOP: [300, 70], MID: [365, 235], BOT: [530, 300] }
};
const BASE = { A: [70, 530], B: [530, 70] };
const LANE_A = { TOP: [95, 170], JGL: [170, 390], MID: [255, 345], ADC: [420, 520], SUP: [452, 506] };
const NODE = { TOP: [105, 150], JGL: [205, 330], MID: [320, 270], ADC: [385, 500], SUP: [480, 430] };
const LETTER = { TOP: "T", JGL: "J", MID: "M", ADC: "A", SUP: "S" };
const OFF = [[-12, -9], [10, -13], [-5, 12], [15, 7], [0, 0]];
const swap = (p) => [p[1], p[0]];

function mapMarkup(draft) {
  const lane = (d, w) => `<path class="lane" d="${d}" stroke-width="${w}"/>`;
  const dash = (d) => `<path class="laneline" d="${d}"/>`;
  const TOPL = "M70 530 L70 70 L530 70";
  const BOTL = "M70 530 L530 530 L530 70";
  const MIDL = "M70 530 L530 70";
  let s = `
    <defs><pattern id="gp" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M30 0H0V30" fill="none" stroke="rgba(26,216,255,.06)"/></pattern></defs>
    <rect width="600" height="600" fill="url(#gp)"/>
    <path class="river" d="M45 45 L555 555"/>
    ${lane(TOPL, 44)}${lane(BOTL, 44)}${lane(MIDL, 38)}
    ${dash(TOPL)}${dash(BOTL)}${dash(MIDL)}
    <rect class="base A" id="rbA" x="26" y="486" width="88" height="88" rx="14"/>
    <rect class="base B" id="rbB" x="486" y="26" width="88" height="88" rx="14"/>
    <text id="baseA" class="baset" x="70" y="537">A</text>
    <text id="baseB" class="baset" x="530" y="77">B</text>
    <g class="pit"><circle cx="${PT.drake[0]}" cy="${PT.drake[1]}" r="20"/><text x="${PT.drake[0]}" y="${PT.drake[1] + 5}">D</text></g>
    <g class="pit"><circle cx="${PT.baron[0]}" cy="${PT.baron[1]}" r="24"/><text x="${PT.baron[0]}" y="${PT.baron[1] + 5}">B</text></g>`;
  if (draft) {
    s += `<g id="nodes">${ROLES.map((r) => {
      const [x, y] = NODE[r.id];
      return `<g class="node" data-role="${r.id}" transform="translate(${x},${y})">
        <circle r="27"/><text class="nr" y="1">${r.id}</text>
        <text class="nn" y="48"></text><text class="nt" y="64"></text></g>`;
    }).join("")}</g>`;
  } else {
    ["A", "B"].forEach((side) =>
      ["TOP", "MID", "BOT"].forEach((l) => {
        const [x, y] = TOWER[side][l];
        s += `<rect id="tw-${side}-${l}" class="tw ${side}" x="${x - 9}" y="${y - 9}" width="18" height="18" rx="3"/>`;
      })
    );
    s += `<g id="fx"></g><g id="dots"></g>`;
  }
  return s;
}

// Positions des 10 joueurs pour un type d'événement
function layout(spec) {
  const L = { A: {}, B: {} };
  ROLE_ID.forEach((r) => {
    L.A[r] = LANE_A[r];
    L.B[r] = swap(LANE_A[r]);
  });
  const place = (side, pt, roles, dir) =>
    roles.forEach((r, i) => {
      const o = OFF[i % 5];
      L[side][r] = [pt[0] + o[0] + dir * 14, pt[1] + o[1] - dir * 14];
    });
  const dirOf = (s) => (s === "A" ? -1 : 1);
  switch (spec.k) {
    case "gank": {
      const roles = { TOP: ["TOP", "JGL"], MID: ["MID", "JGL"], BOT: ["ADC", "SUP", "JGL"] }[spec.lane];
      place("A", PT.lane[spec.lane], roles, -1);
      place("B", PT.lane[spec.lane], roles, 1);
      break;
    }
    case "fight":
      place("A", spec.pt, ROLE_ID, -1);
      place("B", spec.pt, ROLE_ID, 1);
      break;
    case "drake": {
      const roles = ["ADC", "SUP", "JGL", "MID"];
      place("A", PT.drake, roles, -1);
      place("B", PT.drake, roles, 1);
      break;
    }
    case "baron":
      place("A", PT.baron, ROLE_ID, -1);
      place("B", PT.baron, ROLE_ID, 1);
      break;
    case "tower": {
      const att = spec.att, def = att === "A" ? "B" : "A";
      const tw = TOWER[def][spec.lane];
      place(att, tw, ROLE_ID, dirOf(att));
      place(def, lerp(tw, BASE[def], 0.3), ROLE_ID, dirOf(def));
      break;
    }
    case "nexus": {
      const att = spec.att, def = att === "A" ? "B" : "A";
      place(att, BASE[def], ROLE_ID, dirOf(att));
      place(def, BASE[def], ROLE_ID, dirOf(def));
      break;
    }
    default:
      break;
  }
  return L;
}

/* ---------- 5. DRAFT ---------- */
function startDraft() {
  D = {
    step: 0, picks: [{}, {}],
    rerolls: [CFG.REROLLS, CFG.REROLLS],
    opts: [{}, {}], taken: new Set(), role: null, aiBusy: false
  };
  $("#draftMap").innerHTML = mapMarkup(true);
  $("#baseA").textContent = "P1";
  $("#baseB").textContent = S.opp === "ai" ? "PRG" : "P2";
  showScreen("draft", "DRAFT");
  renderDraft();
}

$("#draftMap").addEventListener("click", (e) => {
  const g = e.target.closest(".node");
  if (!g || !D) return;
  const w = ORDER[D.step];
  if (S.opp === "ai" && w === 1) return;
  const role = g.dataset.role;
  if (D.picks[w][role]) return;
  D.role = role;
  renderDraft();
});

function genOptions(role) {
  const pool = shuffle(ALL.filter((p) => p.role === role && !D.taken.has(p.id)));
  const out = [], teams = new Set();
  for (const p of pool) {
    if (!teams.has(p.team)) {
      teams.add(p.team);
      out.push(p);
    }
    if (out.length === 3) break;
  }
  return out;
}
function getOpts(w, role) {
  let o = D.opts[w][role];
  if (!o || o.some((p) => D.taken.has(p.id))) {
    o = genOptions(role);
    D.opts[w][role] = o;
  }
  return o;
}

function renderDraft() {
  if (D.step >= 10) return startTournament();
  const w = ORDER[D.step];
  const ai = S.opp === "ai" && w === 1;
  const turn = $("#dTurn");
  turn.textContent = `${S.names[w]} · pick ${D.step + 1}/10`;
  turn.style.borderColor = HCOL[w];
  turn.style.color = HCOL[w];
  $("#dInfo").textContent =
    S.mode === "three"
      ? `Rerolls : ${S.names[0]} ${D.rerolls[0]} · ${S.names[1]} ${D.rerolls[1]}`
      : "Mode libre : tous les joueurs sont disponibles";
  updateNodes(w);
  renderPanel(w, ai);
  renderRosters(w);
  if (ai && !D.aiBusy) {
    D.aiBusy = true;
    setTimeout(aiDraft, 900);
  }
}

function updateNodes(w) {
  $$(".node").forEach((g) => {
    const role = g.dataset.role;
    const p = D.picks[w][role];
    g.classList.toggle("filled", !!p);
    g.classList.toggle("dead", !!p);
    g.classList.toggle("sel", D.role === role);
    g.querySelector("circle").style.fill = p ? p.color : "";
    g.querySelector(".nn").textContent = p ? p.name : "";
    g.querySelector(".nt").textContent = p ? p.team : "";
  });
}

function renderPanel(w, ai) {
  const box = $("#dPanel");
  box.innerHTML = "";
  if (ai) {
    box.append(el("p", "hint", "Le programme réfléchit…"));
    return;
  }
  if (!D.role) {
    box.append(el("p", "hint", "Clique sur un poste de la carte pour voir les propositions."));
    return;
  }
  const role = ROLES.find((r) => r.id === D.role);
  box.append(el("h3", "ptitle", `CHOISIS TON ${role.label.toUpperCase()}`));

  if (S.mode === "three") {
    const wrap = el("div", "grid3");
    getOpts(w, D.role).forEach((p) => {
      const c = el("button", "card pcard");
      c.style.borderColor = p.color;
      c.append(chip(p.team, p.color), el("span", "big", p.name), el("span", "sm", p.teamName));
      c.addEventListener("click", () => pickPlayer(p));
      wrap.append(c);
    });
    box.append(wrap);
    const rr = el("button", "reroll", `REROLL (${D.rerolls[w]})`);
    rr.disabled = D.rerolls[w] <= 0;
    rr.addEventListener("click", () => {
      D.rerolls[w]--;
      const before = getOpts(w, D.role).map((p) => p.id).sort().join();
      let n = genOptions(D.role);
      for (let i = 0; i < 5 && n.map((p) => p.id).sort().join() === before; i++) n = genOptions(D.role);
      D.opts[w][D.role] = n;
      renderDraft();
    });
    box.append(rr);
    return;
  }

  // Mode libre : recherche + liste
  const search = el("input");
  search.type = "text";
  search.placeholder = "Rechercher (pseudo ou équipe)…";
  const list = el("div", "plist");
  box.append(search, list);
  const fill = () => {
    const q = search.value.trim().toLowerCase();
    list.innerHTML = "";
    ALL.filter((p) => p.role === D.role && !D.taken.has(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((p) => {
        const row = el("button", "card prow");
        row.append(chip(p.team, p.color), el("strong", "", p.name));
        row.addEventListener("click", () => pickPlayer(p));
        list.append(row);
      });
  };
  search.addEventListener("input", fill);
  fill();
}

function renderRosters(active) {
  const box = $("#dRosters");
  box.innerHTML = "";
  [0, 1].forEach((i) => {
    const c = el("div", "roster" + (i === active ? " act" : ""));
    c.style.setProperty("--c", HCOL[i]);
    c.append(el("h4", "", S.names[i]));
    ROLES.forEach((r) => {
      const p = D.picks[i][r.id];
      const row = el("div", "rrow");
      row.append(el("span", "rr", r.label), el("span", p ? "rn" : "rn empty", p ? p.name : "—"));
      if (p) row.append(chip(p.team, p.color));
      c.append(row);
    });
    box.append(c);
  });
}

function pickPlayer(p) {
  const w = ORDER[D.step];
  if (D.picks[w][p.role] || D.taken.has(p.id)) return;
  D.picks[w][p.role] = p;
  D.taken.add(p.id);
  delete D.opts[w][p.role];
  D.step++;
  D.role = null;
  D.aiBusy = false;
  renderDraft();
}

function aiDraft() {
  const w = 1;
  const noise = { easy: 16, normal: 8, hard: 2 }[S.diff];
  const thr = { easy: 0, normal: 80, hard: 86 }[S.diff];
  const remaining = ROLE_ID.filter((r) => !D.picks[w][r]);
  let cand = [];
  if (S.mode === "free") {
    remaining.forEach((r) => ALL.filter((p) => p.role === r && !D.taken.has(p.id)).forEach((p) => cand.push(p)));
  } else {
    for (let g = 0; g < 6 && D.rerolls[w] > 0; g++) {
      const bests = remaining
        .map((r) => ({ r, best: Math.max(...getOpts(w, r).map((p) => p.rating)) }))
        .sort((a, b) => a.best - b.best);
      if (bests[bests.length - 1].best >= thr) break;
      D.rerolls[w]--;
      D.opts[w][bests[0].r] = genOptions(bests[0].r);
    }
    remaining.forEach((r) => getOpts(w, r).forEach((p) => cand.push(p)));
  }
  let best = cand[0], bs = -Infinity;
  cand.forEach((p) => {
    const sc = p.rating + (Math.random() * 2 - 1) * noise;
    if (sc > bs) { bs = sc; best = p; }
  });
  // On montre le choix avant de valider
  D.role = best.role;
  updateNodes(w);
  $("#dPanel").innerHTML = "";
  $("#dPanel").append(el("p", "hint", `Le programme choisit ${best.name} (${best.team})…`));
  setTimeout(() => pickPlayer(best), 1100);
}

/* ---------- 6. TOURNOI ---------- */
function mkTeam(o) {
  return Object.assign({ id: 0, human: null, reach: 0 }, o, powerOf(o.roster));
}
function mkMatch(stage, a, b, label) {
  const m = { stage, a, b, label, done: false, w: null, ka: 0, kb: 0 };
  T.matches.push(m);
  return m;
}
const isAnimated = (m) =>
  [m.a, m.b].some((id) => {
    const h = T.teams[id].human;
    return h !== null && (S.opp === "local" || h === 0);
  });

function startTournament() {
  const teams = [];
  TEAMS.forEach((t) => {
    const roster = {};
    ROLE_ID.forEach((r) => (roster[r] = ALL.find((p) => p.id === t.tag + "-" + r)));
    teams.push(mkTeam({ name: t.name, tag: t.tag, color: t.color, roster }));
  });
  [0, 1].forEach((i) =>
    teams.push(mkTeam({
      name: S.names[i], human: i, color: HCOL[i], roster: D.picks[i],
      tag: i === 0 ? "P1" : S.opp === "ai" ? "PRG" : "P2"
    }))
  );
  teams.forEach((t, i) => (t.id = i));

  const aiIds = shuffle(teams.filter((t) => t.human === null).map((t) => t.id));
  const g1 = rnd(0, 3);
  let g2 = rnd(0, 3);
  while (g2 === g1) g2 = rnd(0, 3);
  const groups = [[], [], [], []];
  groups[g1].push(teams.find((t) => t.human === 0).id);
  groups[g2].push(teams.find((t) => t.human === 1).id);
  groups.forEach((g) => { while (g.length < 4) g.push(aiIds.pop()); });

  T = { teams, groups: groups.map(shuffle), matches: [], phase: "groups", day: 0, bracket: { qf: [], sf: [], f: [] }, busy: false };
  T.groups.forEach((g, gi) => {
    const [a, b, c, d] = g;
    [[[a, b], [c, d]], [[a, c], [b, d]], [[a, d], [b, c]]].forEach((pairs, day) =>
      pairs.forEach(([x, y]) => {
        const m = mkMatch("group", x, y, `Groupe ${"ABCD"[gi]} · J${day + 1}`);
        m.group = gi;
        m.day = day;
      })
    );
  });
  showScreen("hub", STAGE_LABEL.groups);
  renderHub();
}

function standings(gi) {
  const rows = T.groups[gi].map((id) => ({ id, w: 0, l: 0, kd: 0 }));
  T.matches
    .filter((m) => m.stage === "group" && m.group === gi && m.done)
    .forEach((m) => {
      const ra = rows.find((r) => r.id === m.a), rb = rows.find((r) => r.id === m.b);
      ra.kd += m.ka - m.kb;
      rb.kd += m.kb - m.ka;
      if (m.w === m.a) { ra.w++; rb.l++; } else { rb.w++; ra.l++; }
    });
  return rows.sort((x, y) => y.w - x.w || y.kd - x.kd || T.teams[y.id].power - T.teams[x.id].power);
}

function currentMatches() {
  if (T.phase === "groups") return T.matches.filter((m) => m.stage === "group" && m.day === T.day);
  if (T.phase === "done") return [];
  return T.bracket[T.phase];
}

function quickResolve(m) {
  const A = T.teams[m.a], B = T.teams[m.b];
  const winA = Math.random() < winProb(A.power, B.power);
  const wk = rnd(12, 28), lk = Math.max(2, wk - rnd(-6, 14));
  m.w = winA ? m.a : m.b;
  m.ka = winA ? wk : lk;
  m.kb = winA ? lk : wk;
  m.done = true;
}

function setupKnockout(st) {
  const B = T.bracket;
  if (st === "qf") {
    const s = [0, 1, 2, 3].map(standings);
    const pr = [[s[0][0], s[1][1]], [s[2][0], s[3][1]], [s[1][0], s[0][1]], [s[3][0], s[2][1]]];
    B.qf = pr.map((p, i) => mkMatch("qf", p[0].id, p[1].id, `Quart ${i + 1}`));
  }
  if (st === "sf") {
    const w = B.qf.map((m) => m.w);
    B.sf = [mkMatch("sf", w[0], w[1], "Demi-finale 1"), mkMatch("sf", w[2], w[3], "Demi-finale 2")];
  }
  if (st === "f") {
    const w = B.sf.map((m) => m.w);
    B.f = [mkMatch("f", w[0], w[1], "Finale")];
  }
  const reach = { qf: 1, sf: 2, f: 3 }[st];
  B[st].forEach((m) => [m.a, m.b].forEach((id) => (T.teams[id].reach = Math.max(T.teams[id].reach, reach))));
}

function advance() {
  if (T.phase === "groups") {
    if (T.day < 2) T.day++;
    else { setupKnockout("qf"); T.phase = "qf"; }
  } else if (T.phase === "qf") { setupKnockout("sf"); T.phase = "sf"; }
  else if (T.phase === "sf") { setupKnockout("f"); T.phase = "f"; }
  else if (T.phase === "f") {
    T.teams[T.bracket.f[0].w].reach = 4;
    T.phase = "done";
  }
}

async function playStage() {
  if (T.busy) return;
  T.busy = true;
  $("#dockBtn").disabled = true;
  const ms = currentMatches().filter((m) => !m.done);
  ms.filter((m) => !isAnimated(m)).forEach(quickResolve);
  for (const m of ms.filter(isAnimated)) await playAnimated(m);
  advance();
  T.busy = false;
  $("#dockBtn").disabled = false;
  showScreen("hub", STAGE_LABEL[T.phase === "groups" ? "groups" : T.phase]);
  renderHub();
}

function renderHub() {
  renderGroups();
  renderBracket();
  renderDock();
}

function renderGroups() {
  const box = $("#groups");
  box.innerHTML = "";
  T.groups.forEach((g, gi) => {
    const card = el("div", "gcard");
    card.append(el("h3", "", "GROUPE " + "ABCD"[gi]));
    const finished = T.phase !== "groups";
    standings(gi).forEach((r, i) => {
      const t = T.teams[r.id];
      const row = el("div", "grow" + (t.human !== null ? " hum" : "") + (finished ? (i < 2 ? " q" : " out") : ""));
      row.style.setProperty("--c", t.color);
      row.append(el("span", "rk", String(i + 1)), chip(t.tag, t.color), el("span", "nm", t.name),
        el("span", "rc", `${r.w}-${r.l}`), el("span", "kd", (r.kd > 0 ? "+" : "") + r.kd));
      card.append(row);
    });
    const res = el("div", "gres");
    T.matches.filter((m) => m.stage === "group" && m.group === gi && m.done).forEach((m) => {
      const a = T.teams[m.a], b = T.teams[m.b];
      const line = el("div");
      const an = el("span", "", a.tag), bn = el("span", "", b.tag);
      if (m.w === m.a) an.style.color = "#fff"; else bn.style.color = "#fff";
      line.append(an, ` ${m.ka}–${m.kb} `, bn);
      res.append(line);
    });
    card.append(res);
    box.append(card);
  });
}

function matchBlock(m, labels, tag) {
  const b = el("div", "bm");
  const lines = el("div", "lines");
  [0, 1].forEach((i) => {
    const ln = el("div", "ln");
    if (m) {
      const id = i === 0 ? m.a : m.b;
      const t = T.teams[id];
      ln.append(el("span", "n", t.name));
      if (m.done) {
        ln.append(el("span", "k", String(i === 0 ? m.ka : m.kb)));
        ln.classList.add(m.w === id ? "win" : "lose");
      }
      if (t.human !== null) { ln.classList.add("hum"); ln.style.setProperty("--c", t.color); }
    } else {
      ln.classList.add("tbd");
      ln.textContent = labels[i];
    }
    lines.append(ln);
  });
  b.append(lines, el("div", "mbox", tag));
  return b;
}

function renderBracket() {
  const box = $("#bracket");
  box.innerHTML = "";
  box.append(el("div", "btitle", "TABLEAU FINAL"));
  const rounds = [
    ["qf", "QUARTS", ["Q1", "Q2", "Q3", "Q4"], [["1er A", "2e B"], ["1er C", "2e D"], ["1er B", "2e A"], ["1er D", "2e C"]]],
    ["sf", "DEMIES", ["D1", "D2"], [["V. Q1", "V. Q2"], ["V. Q3", "V. Q4"]]],
    ["f", "FINALE", ["F"], [["V. D1", "V. D2"]]]
  ];
  const wrap = el("div", "rounds");
  rounds.forEach(([key, title, tags, labels]) => {
    const col = el("div", "rcol");
    col.append(el("h4", "", title));
    tags.forEach((tg, i) => col.append(matchBlock(T.bracket[key][i], labels[i], tg)));
    wrap.append(col);
  });
  const cc = el("div", "rcol");
  if (T.phase === "done") {
    const champ = T.teams[T.bracket.f[0].w];
    const c = el("div", "champ");
    c.append(el("small", "", "CHAMPION"), el("b", "", champ.name));
    cc.append(c);
  }
  wrap.append(cc);
  box.append(wrap);
}

function renderDock() {
  const btn = $("#dockBtn"), info = $("#dockInfo");
  const ph = T.phase;
  if (ph === "done") {
    info.textContent = `${T.teams[T.bracket.f[0].w].name} est champion du monde !`;
    btn.textContent = "VOIR LE VERDICT";
    btn.onclick = showFinal;
    return;
  }
  const ms = currentMatches();
  const anim = ms.filter(isAnimated);
  const label = ph === "groups" ? `Phase de groupes · journée ${T.day + 1}/3` : STAGE_LABEL[ph];
  info.textContent = anim.length
    ? `${label} · ${anim.map((m) => T.teams[m.a].name + " vs " + T.teams[m.b].name).join(" | ")}`
    : `${label} · tes équipes sont éliminées`;
  btn.textContent = anim.length ? "JOUER" : "SIMULER";
  btn.onclick = playStage;
}

/* ---------- 7. MATCH ANIMÉ ---------- */
function playAnimated(m) {
  return new Promise((resolve) => {
    M = {
      m, resolve, speed: S.speed, skip: false, wake: null, lastLay: "",
      kills: { A: 0, B: 0 }, towers: { A: 0, B: 0 }, drakes: { A: 0, B: 0 }, mom: 0
    };
    setupMatch();
  });
}

function sleep(ms) {
  return new Promise((r) => {
    if (M.skip) return r();
    const id = setTimeout(() => { M.wake = null; r(); }, ms / M.speed);
    M.wake = () => { clearTimeout(id); M.wake = null; r(); };
  });
}

function setSpeed(v) {
  S.speed = v;
  if (M) M.speed = v;
  $("#simMap").style.setProperty("--mv", 0.95 / v + "s");
  $$(".spd[data-s]").forEach((b) => b.classList.toggle("on", Number(b.dataset.s) === v));
}
$$(".spd[data-s]").forEach((b) => b.addEventListener("click", () => setSpeed(Number(b.dataset.s))));
$("#btnSkip").addEventListener("click", () => {
  if (!M) return;
  M.skip = true;
  $("#simMap").style.setProperty("--mv", "0s");
  if (M.wake) M.wake();
});

function setupMatch() {
  const m = M.m;
  const A = T.teams[m.a], B = T.teams[m.b];
  M.A = A;
  M.B = B;
  showScreen("match", STAGE_LABEL[T.phase]);
  $("#mStage").textContent = m.label.toUpperCase();
  [["A", A], ["B", B]].forEach(([s, t]) => {
    const tg = $("#sbTag" + s);
    tg.textContent = t.tag;
    tg.style.background = t.color;
    $("#sbName" + s).textContent = t.name;
    $("#sbStat" + s).textContent = "Tours 0 · Dragons 0";
  });
  $("#kA").textContent = "0";
  $("#kB").textContent = "0";
  $("#mClock").textContent = "00:00";
  $("#momA").style.width = "50%";
  $("#simMap").innerHTML = mapMarkup(false);
  $("#baseA").textContent = A.tag;
  $("#baseB").textContent = B.tag;
  buildDots();
  setSpeed(S.speed);
  moveTo(layout({ k: "lane" }));

  // Avant-match : compositions + chances
  [["A", A, "#luA"], ["B", B, "#luB"]].forEach(([s, t, sel]) => {
    const box = $(sel);
    box.className = "lu " + s;
    box.innerHTML = "";
    box.append(el("h5", "", t.name));
    ROLES.forEach((r) => {
      const row = el("div");
      row.append(el("i", "", r.id), el("span", "", t.roster[r.id].name));
      box.append(row);
    });
    box.append(el("p", "", `Puissance ${t.power.toFixed(1)}` + (t.syn ? ` (synergie +${(t.syn / 5).toFixed(1)})` : "")));
  });
  const p = winProb(A.power, B.power);
  $("#oddsA").style.width = (p * 100).toFixed(0) + "%";
  $("#oA").textContent = (p * 100).toFixed(0) + "%";
  $("#oB").textContent = (100 - p * 100).toFixed(0) + "%";

  $("#pre").classList.remove("hidden");
  $("#live").classList.add("hidden");
  $("#mResult").classList.add("hidden");
  $("#feedNow").textContent = "";
  $("#feedNow").dataset.t = "";
  $("#feedList").innerHTML = "";
  $("#btnGo").onclick = runSim;
}

function buildDots() {
  const g = $("#dots");
  M.dots = { A: {}, B: {} };
  ["A", "B"].forEach((s) =>
    ROLE_ID.forEach((r) => {
      const d = document.createElementNS(NS, "g");
      d.setAttribute("class", "dot " + s);
      d.innerHTML = `<circle r="12"/><text y="1">${LETTER[r]}</text><title>${(s === "A" ? M.A : M.B).roster[r].name}</title>`;
      g.append(d);
      M.dots[s][r] = d;
    })
  );
}

function moveTo(L) {
  ["A", "B"].forEach((s) =>
    ROLE_ID.forEach((r) => {
      const [x, y] = L[s][r];
      M.dots[s][r].style.transform = `translate(${x}px, ${y}px)`;
    })
  );
}

function pulse(pt, ben) {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", pt[0]);
  c.setAttribute("cy", pt[1]);
  c.setAttribute("r", 14);
  c.setAttribute("class", "pulse " + (ben || ""));
  $("#fx").append(c);
  setTimeout(() => c.remove(), 1500);
}

const fmtClock = (t) => String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");

function pushLine(text, type, ben) {
  const now = $("#feedNow");
  if (now.dataset.t) {
    const li = el("li", now.dataset.c || "", now.dataset.t);
    $("#feedList").prepend(li);
    while ($("#feedList").children.length > 5) $("#feedList").lastChild.remove();
  }
  now.textContent = text;
  now.dataset.t = text;
  now.dataset.c = ben ? "b" + ben : "";
  now.className = "now " + type + (ben ? " b" + ben : "");
  void now.offsetWidth;
  now.classList.add("pop");
}

function updateScore() {
  $("#kA").textContent = M.kills.A;
  $("#kB").textContent = M.kills.B;
  $("#sbStatA").textContent = `Tours ${M.towers.A} · Dragons ${M.drakes.A}`;
  $("#sbStatB").textContent = `Tours ${M.towers.B} · Dragons ${M.drakes.B}`;
  $("#momA").style.width = (50 + 45 * Math.tanh(M.mom / 4)).toFixed(1) + "%";
}

async function playEvent(ev) {
  $("#mClock").textContent = fmtClock(ev.t);
  const key = JSON.stringify(ev.lay);
  const moved = key !== M.lastLay;
  M.lastLay = key;
  moveTo(layout(ev.lay));
  await sleep(moved ? 1000 : 350);
  pulse(ev.pt, ev.ben);
  ["A", "B"].forEach((s) => {
    M.kills[s] += ev.kills[s];
    M.towers[s] += ev.towers[s];
    M.drakes[s] += ev.drakes[s];
  });
  M.mom += ev.gold.A - ev.gold.B;
  if (ev.tdown) {
    const tw = $(`#tw-${ev.tdown.side}-${ev.tdown.lane}`);
    if (tw) tw.classList.add("down");
  }
  if (ev.type === "end") {
    const rb = $(ev.ben === "A" ? "#rbB" : "#rbA");
    if (rb) rb.classList.add("boom");
  }
  updateScore();
  pushLine(ev.text, ev.type, ev.ben);
  await sleep(ev.hint ? 1200 : 1750);
}

async function runSim() {
  $("#pre").classList.add("hidden");
  $("#live").classList.remove("hidden");
  const A = M.A, B = M.B;
  M.win = Math.random() < winProb(A.power, B.power) ? "A" : "B";
  const evs = buildEvents(A, B, M.win);
  await sleep(500);
  for (const ev of evs) await playEvent(ev);
  endMatch();
}

function endMatch() {
  const m = M.m;
  m.done = true;
  m.w = M.win === "A" ? m.a : m.b;
  m.ka = M.kills.A;
  m.kb = M.kills.B;
  const w = T.teams[m.w];
  $("#live").classList.add("hidden");
  $("#mResult").classList.remove("hidden");
  $("#resName").textContent = w.name;
  $("#resScore").textContent = `${T.teams[m.a].name} ${m.ka} – ${m.kb} ${T.teams[m.b].name}`;
  const resolve = M.resolve;
  $("#btnNext").onclick = () => {
    M = null;
    resolve();
  };
}

// Génère le scénario du match (le vainqueur est tiré d'abord, le suspense vient ensuite)
function buildEvents(A, B, win) {
  const tm = (s) => (s === "A" ? A : B);
  const op = (s) => (s === "A" ? "B" : "A");
  const nm = (s, r) => tm(s).roster[r].name;
  const dn = (s) => tm(s).name;
  const ch = (pw) => (Math.random() < pw ? win : op(win));
  const zero = () => ({ A: 0, B: 0 });
  const val = (s, n, s2, n2) => {
    const o = zero();
    o[s] += n;
    if (s2) o[s2] += n2;
    return o;
  };
  const down = { A: [], B: [] };
  const evs = [];
  const push = (o) =>
    evs.push(Object.assign({ kills: zero(), towers: zero(), drakes: zero(), gold: zero(), hint: false, type: "info", ben: null }, o));

  const T0 = [0, 200, 400, 620, 860, 1160, 1190, 1520, 1780, 1930].map((x, i) => (i ? x + rnd(0, 40) : 0));
  for (let i = 1; i < T0.length; i++) if (T0[i] <= T0[i - 1]) T0[i] = T0[i - 1] + 15;

  // 0. Début
  push({
    t: T0[0], lay: { k: "lane" }, pt: BASE.A, type: "info",
    text: `${dn("A")} contre ${dn("B")} : le match commence. Qui va prendre l'avantage ?`
  });

  // 1. First blood
  {
    const lane = oneOf(["TOP", "MID", "BOT"]);
    const X = ch(0.5), Y = op(X);
    const lr = lane === "BOT" ? "ADC" : lane;
    const k = nm(X, lr), v = nm(Y, lr), j = nm(X, "JGL");
    push({
      t: T0[1], lay: { k: "gank", lane }, pt: PT.lane[lane], type: "kill", ben: X,
      kills: val(X, 1), gold: val(X, 0.6),
      text: oneOf([
        `FIRST BLOOD ! ${k} surprend ${v} en ${LANE_LABEL[lane]} et lance ${dn(X)} !`,
        `Gank parfait de ${j} : ${v} tombe en premier, ${dn(X)} ouvre le score !`,
        `${k} sort le combo parfait sur ${v} : premier sang pour ${dn(X)} !`
      ])
    });
  }

  // 2. Dragon
  {
    const X = ch(0.5), Y = op(X);
    const j = nm(X, "JGL");
    const steal = Math.random() < 0.2;
    push({
      t: T0[2], lay: { k: "drake" }, pt: PT.drake, type: "obj", ben: X,
      drakes: val(X, 1), gold: val(X, 0.7),
      text: steal
        ? `${dn(Y)} lance le Dragon... mais ${j} le VOLE au dernier moment !`
        : oneOf([`${j} sécurise le Dragon pour ${dn(X)}.`, `${dn(X)} prend le Dragon et marque des points précieux.`])
    });
  }

  // 3. Tourelle
  {
    const X = ch(0.55), Y = op(X);
    const free = ["TOP", "MID", "BOT"].filter((l) => !down[Y].includes(l));
    const lane = oneOf(free.length ? free : ["TOP", "MID", "BOT"]);
    down[Y].push(lane);
    const k = nm(X, lane === "BOT" ? "ADC" : lane);
    push({
      t: T0[3], lay: { k: "tower", lane, att: X }, pt: TOWER[Y][lane], type: "obj", ben: X,
      towers: val(X, 1), gold: val(X, 1), kills: val(X, rnd(0, 1)), tdown: { side: Y, lane },
      text: oneOf([
        `La tourelle ${LANE_LABEL[lane]} de ${dn(Y)} s'effondre sous la pression de ${k} !`,
        `${dn(X)} ouvre la carte : tourelle ${LANE_LABEL[lane]} détruite !`,
        `${k} plonge et fait tomber la tourelle ${LANE_LABEL[lane]} !`
      ])
    });
  }

  // 4. Teamfight mid
  {
    const X = ch(0.55), Y = op(X);
    const kx = rnd(2, 4), ky = rnd(0, 2);
    const m = nm(X, "MID"), s = nm(X, "SUP");
    push({
      t: T0[4], lay: { k: "fight", pt: PT.lane.MID }, pt: PT.lane.MID, type: "fight", ben: X,
      kills: val(X, kx, Y, ky), gold: val(X, 1.3),
      text: oneOf([
        `TEAMFIGHT AU MID ! ${m} fait des ravages : ${kx} éliminations pour ${dn(X)}, ${ky} en face.`,
        `Gros engage de ${s} ! ${dn(X)} gagne le combat ${kx} à ${ky}.`
      ])
    });
  }

  // 5. Suspense : le Baron apparaît
  push({
    t: T0[5], lay: { k: "baron" }, pt: PT.baron, type: "hint", hint: true,
    text: "Le Baron Nashor apparaît... Les deux équipes se ruent vers la fosse !"
  });

  // 6. Baron
  {
    const X = ch(0.6), Y = op(X);
    const j = nm(X, "JGL");
    const steal = Math.random() < 0.3;
    push({
      t: T0[6], lay: { k: "baron" }, pt: PT.baron, type: "obj", ben: X,
      gold: val(X, 1.8), kills: val(X, rnd(1, 2)),
      text: steal
        ? `${dn(Y)} commence le Baron... ${j} le VOLE !!! Quel moment !`
        : oneOf([`${dn(X)} sécurise le Baron Nashor, ${j} garde son sang-froid.`, `Le Baron tombe : ${dn(X)} prend un avantage énorme !`])
    });
  }

  // 7. Combat décisif / ACE
  {
    const X = ch(0.7), Y = op(X);
    const kx = rnd(3, 5), ky = rnd(0, 2);
    const a = nm(X, "ADC");
    const pt = lerp(PT.lane.MID, BASE[Y], 0.35);
    push({
      t: T0[7], lay: { k: "fight", pt }, pt, type: "fight", ben: X,
      kills: val(X, kx, Y, ky), gold: val(X, 1.5),
      text: kx === 5
        ? `ACE ! ${dn(X)} efface les 5 joueurs de ${dn(Y)} !`
        : oneOf([`${a} est monstrueux : ${kx} kills, ${dn(Y)} est en miettes !`, `Combat décisif ! ${dn(X)} l'emporte ${kx} à ${ky}.`])
    });
  }

  // 8. Siège
  {
    const X = win, Y = op(X);
    push({
      t: T0[8], lay: { k: "tower", lane: "MID", att: X }, pt: TOWER[Y].MID, type: "obj", ben: X,
      gold: val(X, 1),
      text: `Les inhibiteurs tombent... ${dn(X)} avance sur le Nexus !`
    });
  }

  // 9. Nexus
  push({
    t: T0[9], lay: { k: "nexus", att: win }, pt: BASE[op(win)], type: "end", ben: win,
    kills: val(win, rnd(0, 2)),
    text: `NEXUS DÉTRUIT ! ${dn(win)} remporte le match !`
  });

  return evs;
}

/* ---------- 8. ÉCRAN FINAL ---------- */
function showFinal() {
  const champ = T.teams[T.bracket.f[0].w];
  showScreen("final", "CHAMPIONS DU MONDE");
  $("#cName").textContent = champ.name;

  const hs = [0, 1].map((i) => T.teams.find((t) => t.human === i));
  const rec = (t) => {
    let w = 0, kd = 0;
    T.matches
      .filter((m) => m.done && (m.a === t.id || m.b === t.id))
      .forEach((m) => {
        const mine = m.a === t.id;
        kd += mine ? m.ka - m.kb : m.kb - m.ka;
        if (m.w === t.id) w++;
      });
    return { w, kd };
  };
  const sc = hs.map((t) => Object.assign({ t }, rec(t)));
  const c = sc[0].t.reach - sc[1].t.reach || sc[0].w - sc[1].w || sc[0].kd - sc[1].kd;
  $("#verdict").textContent = c === 0 ? "ÉGALITÉ PARFAITE !" : `${(c > 0 ? hs[0] : hs[1]).name} GAGNE LE DUEL !`;

  const grid = $("#fGrid");
  grid.innerHTML = "";
  sc.forEach(({ t, w, kd }) => {
    const card = el("div", "fcard");
    card.style.setProperty("--c", t.color);
    card.append(el("h3", "", t.name));
    card.append(el("div", "reach", REACH_LABEL[t.reach]));
    ROLES.forEach((r) => {
      const p = t.roster[r.id];
      const row = el("div", "rrow");
      row.append(el("span", "rr", r.label), el("span", "rn", p.name), chip(p.team, p.color), el("span", "rr", String(p.rating)));
      card.append(row);
    });
    card.append(el("div", "pw", `Puissance ${t.power.toFixed(1)} · ${w} victoire(s) · diff. de kills ${kd > 0 ? "+" : ""}${kd}`));
    const j = el("div", "journey");
    T.matches
      .filter((m) => m.done && (m.a === t.id || m.b === t.id))
      .forEach((m) => {
        const mine = m.a === t.id;
        const opp = T.teams[mine ? m.b : m.a];
        const won = m.w === t.id;
        j.append(el("div", won ? "w" : "l",
          `${m.label} : ${won ? "Victoire" : "Défaite"} vs ${opp.name} (${mine ? m.ka : m.kb}–${mine ? m.kb : m.ka})`));
      });
    card.append(j);
    grid.append(card);
  });
}
