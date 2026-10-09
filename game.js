const $ = (s) => document.querySelector(s);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  $("#" + id).classList.remove("hidden");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Données à plat ----------
const ALL = [];
TEAMS.forEach((t) =>
  ROLES.forEach((r) => {
    const [name, rating] = t.players[r.id];
    ALL.push({ id: t.tag + "-" + r.id, name, rating, team: t.tag, color: t.color, role: r.id });
  })
);

// ---------- État ----------
const S = {
  mode: "three",
  opp: "local",
  diff: "normal",
  names: ["Joueur 1", "Joueur 2"],
  step: 0,
  picks: [{}, {}],
  rerolls: [3, 3],
  options: [],
  taken: new Set()
};

// ---------- Menu ----------
document.querySelectorAll("[data-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    S.mode = b.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("sel", x === b));
  })
);

document.querySelectorAll("[data-opp]").forEach((b) =>
  b.addEventListener("click", () => {
    S.opp = b.dataset.opp;
    document.querySelectorAll("[data-opp]").forEach((x) => x.classList.toggle("sel", x === b));
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
  S.step = 0;
  S.picks = [{}, {}];
  S.rerolls = [3, 3];
  S.taken = new Set();
  show("game");
  next();
});

$("#replay").addEventListener("click", () => $("#start").click());
$("#toMenu").addEventListener("click", () => show("menu"));

// ---------- Logique de draft ----------
function cur() {
  const roleIndex = Math.floor(S.step / 2);
  const first = roleIndex % 2; // le premier à choisir alterne
  const who = S.step % 2 === 0 ? first : 1 - first;
  return { role: ROLES[roleIndex], who };
}

function genOptions(roleId) {
  const pool = shuffle(ALL.filter((p) => p.role === roleId && !S.taken.has(p.id)));
  const out = [];
  const teams = new Set();
  for (const p of pool) {
    if (!teams.has(p.team)) {
      teams.add(p.team);
      out.push(p);
    }
    if (out.length === 3) break;
  }
  return out;
}

function next() {
  if (S.step >= 10) return end();
  const { role, who } = cur();
  if (S.mode === "three") S.options = genOptions(role.id);
  render();
  if (S.opp === "ai" && who === 1) setTimeout(aiPlay, 1000);
}

function pick(player) {
  const { role, who } = cur();
  S.picks[who][role.id] = player;
  S.taken.add(player.id);
  S.step++;
  next();
}

// ---------- Programme (IA) ----------
function aiPlay() {
  const { role } = cur();
  const noise = { easy: 18, normal: 9, hard: 3 }[S.diff];
  const threshold = { easy: 0, normal: 82, hard: 87 }[S.diff];
  let list;

  if (S.mode === "free") {
    list = ALL.filter((p) => p.role === role.id && !S.taken.has(p.id));
  } else {
    // le programme reroll s'il n'est pas content
    while (S.rerolls[1] > 0 && Math.max(...S.options.map((p) => p.rating)) < threshold) {
      S.rerolls[1]--;
      S.options = genOptions(role.id);
    }
    list = S.options;
  }

  let best = list[0];
  let bestScore = -Infinity;
  list.forEach((p) => {
    const s = p.rating + (Math.random() * 2 - 1) * noise;
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  });
  pick(best);
}

// ---------- Affichage ----------
function render() {
  const { role, who } = cur();
  $("#turn").textContent = S.names[who] + " : choisis ton " + role.label;
  $("#info").textContent =
    S.mode === "three"
      ? "Rerolls : " + S.names[0] + " " + S.rerolls[0] + " · " + S.names[1] + " " + S.rerolls[1]
      : "Mode libre";
  renderBoards(who);
  renderChoices(role, who);
}

function renderBoards(active) {
  [0, 1].forEach((i) => {
    const b = $("#b" + i);
    b.innerHTML = "";
    b.classList.toggle("active", i === active);
    b.append(el("h3", "", S.names[i]));
    ROLES.forEach((r) => {
      const p = S.picks[i][r.id];
      const row = el("div", "slot");
      row.append(el("span", "role", r.label));
      if (p) {
        row.append(el("span", "pname", p.name));
        const t = el("span", "tag", p.team);
        t.style.background = p.color;
        row.append(t);
      } else {
        row.append(el("span", "pname empty", "—"));
      }
      b.append(row);
    });
  });
}

function renderChoices(role, who) {
  const box = $("#choices");
  box.innerHTML = "";

  if (S.opp === "ai" && who === 1) {
    box.append(el("p", "wait", "Le programme réfléchit…"));
    return;
  }

  if (S.mode === "three") {
    const wrap = el("div", "grid3");
    S.options.forEach((p) => {
      const c = el("button", "card pcard");
      c.style.borderColor = p.color;
      const t = el("span", "tag", p.team);
      t.style.background = p.color;
      c.append(t, el("span", "big", p.name), el("span", "", role.label));
      c.addEventListener("click", () => pick(p));
      wrap.append(c);
    });
    box.append(wrap);

    const rr = el("button", "reroll", "Reroll (" + S.rerolls[who] + " restant" + (S.rerolls[who] > 1 ? "s" : "") + ")");
    rr.disabled = S.rerolls[who] === 0;
    rr.addEventListener("click", () => {
      S.rerolls[who]--;
      S.options = genOptions(role.id);
      render();
    });
    box.append(rr);
    return;
  }

  // Mode libre : recherche + liste
  const search = el("input");
  search.type = "text";
  search.placeholder = "Rechercher un " + role.label + " (pseudo ou équipe)…";
  const list = el("div", "plist");
  box.append(search, list);

  function fill() {
    const q = search.value.trim().toLowerCase();
    list.innerHTML = "";
    ALL.filter((p) => p.role === role.id && !S.taken.has(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((p) => {
        const row = el("button", "card prow");
        const t = el("span", "tag", p.team);
        t.style.background = p.color;
        row.append(t, el("strong", "", p.name));
        row.addEventListener("click", () => pick(p));
        list.append(row);
      });
  }
  search.addEventListener("input", fill);
  fill();
}

// ---------- Score & résultat ----------
const SYNERGY = { 1: 0, 2: 4, 3: 10, 4: 18, 5: 30 };

function score(team) {
  const ps = Object.values(team);
  const base = ps.reduce((a, p) => a + p.rating, 0);
  const count = {};
  ps.forEach((p) => (count[p.team] = (count[p.team] || 0) + 1));
  const syn = Object.values(count).reduce((a, c) => a + SYNERGY[c], 0);
  return { base, syn, total: base + syn };
}

function end() {
  const sc = [score(S.picks[0]), score(S.picks[1])];
  const box = $("#finalBoards");
  box.innerHTML = "";

  [0, 1].forEach((i) => {
    const b = el("div", "board");
    b.append(el("h3", "", S.names[i]));
    ROLES.forEach((r) => {
      const p = S.picks[i][r.id];
      const row = el("div", "slot");
      row.append(el("span", "role", r.label), el("span", "pname", p.name));
      const t = el("span", "tag", p.team);
      t.style.background = p.color;
      row.append(t, el("span", "rating", String(p.rating)));
      b.append(row);
    });
    b.append(el("div", "syn", "Synergie : +" + sc[i].syn));
    const tot = el("div", "total", "Total");
    tot.append(el("span", "big", String(sc[i].total)));
    b.append(tot);
    box.append(b);
  });

  const w = $("#winner");
  if (sc[0].total === sc[1].total) w.textContent = "Égalité parfaite !";
  else w.textContent = "Victoire de " + S.names[sc[0].total > sc[1].total ? 0 : 1] + " !";

  show("result");
}
