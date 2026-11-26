/* =========================================================
   PHARMILY 16 — app.js
   Firebase Auth (تسجيل + تذكرني) + Firestore (بروفايلات، شات، ميموريز، Future Me)
   الصور بتتضغط في المتصفح وبتتخزن جوه Firestore => مش محتاجين Firebase Storage (ببلاش على خطة Spark)
   ========================================================= */
(() => {
const { setPersistence, browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  doc, collection, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, increment } = window.PH_FB;

window.__pharmilyReady = true;

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const title = s => clean(s).replace(/\b\w/g, c => c.toUpperCase());
const first2 = n => title(n).split(" ").slice(0, 2).join(" ");
const initials = n => first2(n).split(" ").map(w => w[0]).join("");
const slug = k => clean(k).replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
const emailOf = k => `${slug(k)}@pharmily16.app`;
const ic = (n, c = "") => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const ms = t => t?.toMillis ? t.toMillis() : (typeof t === "number" ? t : Date.now());
const fmtDate = t => new Date(ms(t)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = t => new Date(ms(t)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const put = (el, html) => { if (el._h !== html) { el._h = html; el.innerHTML = html; } };
const raf = fn => requestAnimationFrame(fn);

/* ---------- الطلبة (من data.js) ---------- */
const PEOPLE = STUDENTS.map((s, i) => ({ name: s.name, key: clean(s.name), nickname: s.nickname || "", photo: s.photo || `photos/${i + 1}.jpg` }));
const PBYKEY = new Map(PEOPLE.map(p => [p.key, p]));

/* ---------- Firebase ---------- */
const CONFIGURED = !!window.PH_FB.ready;
const auth = window.PH_FB.auth, db = window.PH_FB.db;
if (window.PH_FB.demo) $("demoBar").hidden = false;

/* ---------- الحالة ---------- */
let me = null, registering = false, started = false;
const users = new Map(), usersByKey = new Map(), memCache = new Map();
let memories = [], memLimit = 24, memUnsub = null;
let chats = [], current = null, threadUnsub = null, threadMsgs = [], threadFor = null;
let futUnsub = null, unsubs = [];
let filterJoined = false, page = 1;
const seenMem = new Set();
const flags = { mem: false, chats: false }; let myMemCount = 0;

/* =========================================================
   UI صغيرة: toast / modal / confirm
   ========================================================= */
function toast(msg, bad) {
  const t = document.createElement("div");
  t.className = "toast" + (bad ? " bad" : "");
  t.innerHTML = ic(bad ? "x" : "check") + `<span>${esc(msg)}</span>`;
  $("toasts").append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 3200);
}
function modal(html, cls = "") {
  const el = document.createElement("div");
  el.className = "modal";
  el.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true"><button class="circle x" data-close aria-label="Close">${ic("x")}</button>${html}</div>`;
  const close = () => { el.classList.remove("in"); setTimeout(() => el.remove(), 320); };
  el.addEventListener("mousedown", e => { if (e.target === el) close(); });
  el.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
  el.close = close;
  document.body.append(el);
  raf(() => el.classList.add("in"));
  return el;
}
const confirmBox = msg => new Promise(res => {
  const m = modal(`<h3>Are you sure?</h3><p class="ar" style="opacity:.8">${esc(msg)}</p><div class="pf-act"><button class="btn primary" data-y>Yes · أيوه</button><button class="btn" data-close>Cancel</button></div>`);
  m.querySelector("[data-y]").onclick = () => { res(true); m.close(); };
  m.addEventListener("click", e => { if (e.target.closest("[data-close]")) res(false); });
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const l = $$(".lb"); if (l.length) return closeLb();
  if ($$(".modal").length === 0 && viewer) return closeViewer();
  const m = $$(".modal").pop(); if (m) return m.close();
  if (!$("chat").hidden) return closeChat();
  $("menu").hidden = true; $("gsPop").hidden = true;
});

/* ---------- الصور: ضغط في المتصفح ---------- */
async function bitmap(file) {
  if (window.createImageBitmap) { try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch (e) { } }
  return await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
}
async function resizeFit(file, max, q) {
  const b = await bitmap(file), w = b.width || b.naturalWidth, h = b.height || b.naturalHeight, k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, c.width, c.height); x.drawImage(b, 0, 0, c.width, c.height);
  let out = c.toDataURL("image/jpeg", q);
  while (out.length > 880000 && q > .35) { q -= .1; out = c.toDataURL("image/jpeg", q); }
  return out;
}
async function resizeSquare(file, size, q) {
  const b = await bitmap(file), w = b.width || b.naturalWidth, h = b.height || b.naturalHeight, s = Math.min(w, h);
  const c = document.createElement("canvas"); c.width = c.height = size;
  c.getContext("2d").drawImage(b, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL("image/jpeg", q);
}

/* ---------- avatars ---------- */
const av = (name, photo, size = 44, cls = "") =>
  `<span class="av ${cls}" style="--sz:${size}px"><span>${esc(initials(name))}</span>${photo ? `<img src="${esc(photo)}" alt="" onerror="this.remove()">` : ""}</span>`;
const avUid = (uid, size) => { const u = users.get(uid); return u ? av(u.name, u.photo, size) : av("?", "", size); };

/* =========================================================
   شاشة التسجيل / الدخول
   ========================================================= */
const showAuth = () => { $("splash").classList.add("off"); $("app").hidden = true; $("auth").hidden = false; };
const authErr = (id, m) => { const e = $(id); e.textContent = m; const f = e.closest("form"); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); };
const authMsg = e => ({
  "auth/email-already-in-use": "الاسم ده متسجل قبل كدا. دوس Sign in وادخل بالباسورد بتاعك.",
  "auth/invalid-credential": "الباسورد غلط. اكتب الباسورد الخاص بيك (مش كود الدفعة).", "auth/wrong-password": "الباسورد غلط.", "auth/user-not-found": "الاسم ده لسه ماسجلش. دوس Register.",
  "auth/weak-password": "الباسورد لازم 6 حروف على الأقل.", "auth/network-request-failed": "مفيش إنترنت. جرب تاني.",
  "auth/operation-not-allowed": "فعّل Email/Password في Firebase (Authentication > Sign-in method).",
  "auth/unauthorized-domain": "ضيف دومين الموقع في Firebase (Authentication > Settings > Authorized domains).",
  "auth/too-many-requests": "محاولات كتير. استنى شوية وجرب."
}[e.code] || ("حصل خطأ: " + (e.code || e.message)));

$$(".tabs button").forEach(b => b.onclick = () => {
  $$(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  $("regForm").hidden = b.dataset.tab !== "register"; $("loginForm").hidden = b.dataset.tab !== "login";
});
$$("[data-eye]").forEach(b => b.onclick = () => {
  const i = b.previousElementSibling, show = i.type === "password"; i.type = show ? "text" : "password";
  b.innerHTML = ic(show ? "eye-off" : "eye");
});

function findPerson(txt) {
  const k = clean(txt); if (!k) return null;
  if (PBYKEY.has(k)) return PBYKEY.get(k);
  const m = PEOPLE.filter(p => p.key.includes(k)); return m.length === 1 ? m[0] : null;
}
function suggest(input) {
  const list = input.parentElement.querySelector(".list");
  const render = () => {
    const k = clean(input.value);
    const m = k ? PEOPLE.filter(p => p.key.includes(k)).slice(0, 6) : [];
    if (!m.length || (m.length === 1 && m[0].key === k)) { list.hidden = true; return; }
    list.innerHTML = m.map(p => `<button type="button" data-n="${esc(p.name)}">${av(p.name, "", 28)}<span style="text-transform:capitalize">${esc(title(p.name))}</span></button>`).join("");
    list.hidden = false;
  };
  input.addEventListener("input", render);
  input.addEventListener("blur", () => setTimeout(() => list.hidden = true, 150));
  list.addEventListener("mousedown", e => { const b = e.target.closest("button"); if (b) { e.preventDefault(); input.value = title(b.dataset.n); list.hidden = true; input.dispatchEvent(new Event("change")); } });
}
suggest($("regName")); suggest($("logName"));

let regPhoto = "";
$("regPhotoBtn").onclick = () => $("regFile").click();
$("regFile").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { regPhoto = await resizeSquare(f, 160, .8); const b = $("regPhotoBtn"); b.classList.add("has"); $("regIni").innerHTML = `<img src="${regPhoto}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`; }
  catch { authErr("regErr", "الصورة دي مش مدعومة. جرب JPG أو PNG."); }
};

$("regForm").onsubmit = async e => {
  e.preventDefault();
  if (!CONFIGURED) return authErr("regErr", "Firebase مش متوصل لسه.");
  const p = findPerson($("regName").value);
  if (!p) return authErr("regErr", "الاسم ده مش من دفعة Pharmily 16. اختاره من القايمة اللي بتظهر.");
  if ($("regCode").value.trim() !== PASSWORD) return authErr("regErr", "كود الدفعة غلط.");
  const pw = $("regPass").value; if (pw.length < 6) return authErr("regErr", "الباسورد لازم 6 حروف على الأقل.");
  const btn = e.submitter || e.target.querySelector("button[type=submit]"); btn.disabled = true; $("regErr").textContent = "";
  try {
    registering = true;
    await setPersistence(auth, $("regRemember").checked ? browserLocalPersistence : browserSessionPersistence);
    const cred = await createUserWithEmailAndPassword(auth, emailOf(p.key), pw);
    const data = { uid: cred.user.uid, name: p.name, key: p.key, nickname: p.nickname, bio: "", photo: regPhoto || "", createdAt: serverTimestamp() };
    await setDoc(doc(db, "users", cred.user.uid), data);
    registering = false;
    await startApp({ ...data, createdAt: Date.now() }, true);
  } catch (err) { registering = false; console.error(err); authErr("regErr", err.code === "permission-denied" ? "قواعد Firestore مش منشورة. راجع الخطوة 6 في الدليل." : authMsg(err)); }
  btn.disabled = false;
};
$("loginForm").onsubmit = async e => {
  e.preventDefault();
  if (!CONFIGURED) return authErr("logErr", "Firebase مش متوصل لسه.");
  const p = findPerson($("logName").value);
  if (!p) return authErr("logErr", "الاسم ده مش من دفعة Pharmily 16.");
  const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true; $("logErr").textContent = "";
  const pw = $("logPass").value;
  try {
    await setPersistence(auth, $("logRemember").checked ? browserLocalPersistence : browserSessionPersistence);
    try { await signInWithEmailAndPassword(auth, emailOf(p.key), pw); }   // onAuthStateChanged هيكمل
    catch (err) {
      // الموبايل ساعات بيضيف مسافة في آخر الباسورد: جرّب من غيرها
      if (pw !== pw.trim() && (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password")) await signInWithEmailAndPassword(auth, emailOf(p.key), pw.trim());
      else throw err;
    }
  } catch (err) {
    console.error(err);
    if ((err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") && pw.trim() === PASSWORD)
      authErr("logErr", "ده كود الدفعة (بيتكتب مرة واحدة وقت التسجيل بس). هنا اكتب الباسورد الخاص بيك اللي اخترته وقت التسجيل. ولو لسه ماسجلتش دوس Register.");
    else authErr("logErr", authMsg(err));
  }
  btn.disabled = false;
};

/* =========================================================
   دخول التطبيق
   ========================================================= */
async function ensureProfile(u) {
  const ref = doc(db, "users", u.uid), s = await getDoc(ref);
  if (s.exists()) return { uid: u.uid, ...s.data() };
  const local = (u.email || "").split("@")[0], p = PEOPLE.find(x => slug(x.key) === local);
  if (!p) { await signOut(auth); throw new Error("no-profile"); }
  const data = { uid: u.uid, name: p.name, key: p.key, nickname: p.nickname, bio: "", photo: "", createdAt: serverTimestamp() };
  await setDoc(ref, data); return data;
}

if (CONFIGURED) {
  onAuthStateChanged(auth, async u => {
    if (registering) return;
    if (!u) { stopApp(); showAuth(); return; }
    if (started && me?.uid === u.uid) return;
    try { await startApp(await ensureProfile(u)); }
    catch (err) { console.error(err); showAuth(); authErr("logErr", err.code === "permission-denied" ? "قواعد Firestore مش منشورة. راجع الدليل." : authMsg(err)); }
  });
} else { $("cfgWarn").hidden = false; showAuth(); }

async function startApp(profile, justRegistered) {
  if (started) stopApp();
  started = true; me = { ...profile };
  $("auth").hidden = true; $("app").hidden = false; $("partyBtn").hidden = false; $("splash").classList.add("off");
  initStatic(); renderAll();
  unsubs.push(onSnapshot(collection(db, "users"), snap => {
    users.clear(); usersByKey.clear();
    snap.forEach(d => { const u = { uid: d.id, ...d.data() }; users.set(d.id, u); usersByKey.set(u.key, u); });
    if (users.get(me.uid)) me = { ...users.get(me.uid) };
    renderAll();
  }, fail));
  listenMemories(); listenJourney();
  unsubs.push(onSnapshot(query(collection(db, "memories"), where("authorId", "==", me.uid), limit(1)), snap => { myMemCount = snap.size; flags.mem = true; renderAll(); }, fail));
  unsubs.push(onSnapshot(query(collection(db, "chats"), where("members", "array-contains", me.uid)), onChats, fail));
  futUnsub = onSnapshot(collection(db, "users", me.uid, "future"), snap => renderFuture(snap.docs.map(d => ({ id: d.id, ...d.data() }))), fail);
  unsubs.push(futUnsub);
  if (justRegistered) { toast("أهلاً بيك في Pharmily! بروفايلك جاهز."); }
}
function stopApp() {
  unsubs.forEach(f => f()); unsubs = []; memUnsub?.(); memUnsub = null; threadUnsub?.(); threadUnsub = null;
  users.clear(); usersByKey.clear(); memories = []; journey = []; chats = []; current = null; me = null; started = false; seenMem.clear();
  flags.mem = flags.chats = false; myMemCount = 0; renderJourney.sig = ""; closeViewer(true); yearOpen = null;
  $("chat").hidden = true; $("partyBtn").hidden = true;
}
function fail(err) { console.error(err); if (err.code === "permission-denied") toast("مفيش صلاحية: تأكد إن قواعد Firestore منشورة.", true); }

/* =========================================================
   الرسم
   ========================================================= */
let queued = false;
function renderAll() { if (queued) return; queued = true; raf(() => { queued = false; if (!me) return; renderNav(); renderStats(); renderPeople(); renderMemories(); renderRail(); renderChatList(); renderThreadHead(); renderJourney(); renderSteps(); }); }

function renderNav() {
  put($("meAv"), av(me.name, me.photo, 34)); $("meName").textContent = first2(me.name).split(" ")[0];
  $("hello").innerHTML = `${ic("sparkles")}<span>Welcome, ${esc(first2(me.name).split(" ")[0])}</span>`;
}
function renderStats() {
  $("stJoined").textContent = users.size; $("stMem").textContent = memories.length >= memLimit ? memLimit + "+" : memories.length;
}

function renderPeople() {
  const v = clean($("q").value);
  const all = PEOPLE.map((p, i) => ({ p, u: usersByKey.get(p.key) })).filter(o => (!v || o.p.key.includes(v)) && (!filterJoined || o.u));
  const n = Math.max(1, Math.ceil(all.length / 30)); if (page > n) page = 1;
  put($("grid"), all.slice((page - 1) * 30, page * 30).map(o => {
    const photo = o.p.photo /* ثابتة: من فولدر photos بس، الطالب مش بيغيّرها */, nick = o.u?.nickname || o.p.nickname;
    return `<button class="st lift tilt ${o.u ? "" : "off"}" data-act="profile" data-v="${esc(o.p.key)}"><div class="av" style="position:relative">${o.u ? '<span class="dot" title="Joined"></span>' : ""}<span>${esc(initials(o.p.name))}</span>${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</div><b>${esc(first2(o.p.name))}</b><i>${esc(nick)}</i></button>`;
  }).join(""));
  put($("pages"), n > 1 ? Array.from({ length: n }, (_, i) => `<button class="btn sm ${i + 1 === page ? "on" : ""}" data-p="${i + 1}">${i + 1}</button>`).join("") : "");
  $("fAll").classList.toggle("on", !filterJoined); $("fJoined").classList.toggle("on", filterJoined);
}
$("pages").onclick = e => { const p = e.target.dataset.p; if (p) { page = +p; renderPeople(); $("meet").scrollIntoView(); } };
$("q").oninput = () => { page = 1; renderPeople(); };
$("fAll").onclick = () => { filterJoined = false; page = 1; renderPeople(); };
$("fJoined").onclick = () => { filterJoined = true; page = 1; renderPeople(); };

/* ---------- Memories ---------- */
function listenMemories() {
  memUnsub?.();
  memUnsub = onSnapshot(query(collection(db, "memories"), orderBy("createdAt", "desc"), limit(memLimit)), snap => {
    memories = snap.docs.map(d => ({ id: d.id, ...d.data() })); memories.forEach(m => memCache.set(m.id, m)); renderAll(); refreshViewer();
  }, fail);
}
$("memMore").onclick = () => { memLimit += 24; listenMemories(); };

/* ---------- الرياكتات (زي فيسبوك) ---------- */
const RX = [
  { k: "like", l: "Like", c: "#2d88ff" }, { k: "love", l: "Love", c: "#f33e58" }, { k: "care", l: "Care", c: "#f7b125" },
  { k: "haha", l: "Haha", c: "#f7b125" }, { k: "wow", l: "Wow", c: "#f7b125" }, { k: "sad", l: "Sad", c: "#f7b125" }, { k: "angry", l: "Angry", c: "#e9710f" }
];
const RXK = Object.fromEntries(RX.map(r => [r.k, r]));
const rxIcon = (k, cls = "") => `<svg class="rx ${cls}" aria-hidden="true"><use href="#r-${k}"/></svg>`;
let lastRx = { id: "", t: 0 };
function rxCounts(m) {
  const c = {}; let t = 0;
  for (const v of Object.values(m.rx || {})) if (v && RXK[v]) { c[v] = (c[v] || 0) + 1; t++; }
  return { c, t, top: Object.entries(c).sort((a, b) => b[1] - a[1]).map(x => x[0]) };
}
function statsHtml(m) {
  const s = rxCounts(m), cc = Math.max(0, m.cc || 0);
  return `<div class="stats">${s.t ? `<button class="rxs" data-act="rxlist" data-v="${m.id}"><span class="stack">${s.top.slice(0, 3).map(k => rxIcon(k)).join("")}</span><b>${s.t}</b></button>` : "<span></span>"}${cc ? `<button class="cmt-n" data-act="zoom" data-v="${m.id}" data-focus="1">${cc} ${cc === 1 ? "comment" : "comments"}</button>` : ""}</div>`;
}
function actsHtml(m) {
  const mine = m.rx?.[me.uid], r = mine && RXK[mine], fresh = lastRx.id === m.id && Date.now() - lastRx.t < 700;
  return `<div class="acts"><button class="act rxb ${r ? "on" : ""}" data-rx="${m.id}" style="${r ? `--c:${r.c}` : ""}" aria-label="React">${r ? rxIcon(mine, "sm " + (fresh ? "fresh" : "")) : ic("thumb")}<span>${r ? r.l : "Like"}</span></button><button class="act" data-act="zoom" data-v="${m.id}" data-focus="1">${ic("comment")}<span>Comment</span></button></div>`;
}
async function react(id, type) {
  const m = memCache.get(id); if (!m || !me) return;
  const cur = m.rx?.[me.uid] || "", next = cur === type ? "" : type;
  m.rx = { ...(m.rx || {}), [me.uid]: next }; lastRx = { id, t: Date.now() };
  renderAll(); refreshViewer();
  try { await setDoc(doc(db, "memories", id), { rx: { [me.uid]: next } }, { merge: true }); }
  catch (e) { console.error(e); m.rx = { ...m.rx, [me.uid]: cur }; renderAll(); refreshViewer(); toast("معرفتش أسجّل التفاعل.", true); }
}
function burst(btn, k) {
  const r = btn.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const f = document.createElement("span"); f.className = "rxfly"; f.innerHTML = rxIcon(k);
    f.style.cssText = `left:${r.left + 20 + Math.random() * 20}px;top:${r.top}px;--dx:${(Math.random() - .5) * 90}px;--dy:${-60 - Math.random() * 60}px;--dl:${i * 40}ms`;
    document.body.append(f); setTimeout(() => f.remove(), 1100);
  }
}
/* صينية الرياكتات */
const tray = document.createElement("div"); tray.id = "rtray"; tray.hidden = true;
tray.innerHTML = RX.map((r, i) => `<button data-k="${r.k}" style="--i:${i}" aria-label="${r.l}"><span class="lbl">${r.l}</span>${rxIcon(r.k)}</button>`).join("");
document.body.append(tray);
let trayFor = null, trayBtn = null, trayTimer = 0, hideTimer = 0, pressTimer = 0, longPressed = false;
function showTray(btn) {
  clearTimeout(hideTimer); trayFor = btn.dataset.rx; trayBtn = btn;
  const r = btn.getBoundingClientRect(), w = RX.length * 50 + 16;
  tray.hidden = false; tray.classList.remove("in");
  tray.style.left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8) + "px";
  tray.style.top = (r.top > 80 ? r.top - 64 : r.bottom + 8) + "px";
  void tray.offsetWidth; tray.classList.add("in");
}
function hideTray(delay = 0) {
  clearTimeout(trayTimer); clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { tray.classList.remove("in"); setTimeout(() => { if (!tray.classList.contains("in")) tray.hidden = true; }, 200); }, delay);
}
const canHover = matchMedia("(hover:hover) and (pointer:fine)");
document.addEventListener("mouseover", e => {
  if (!canHover.matches) return;
  const b = e.target.closest("[data-rx]");
  if (b) { clearTimeout(hideTimer); clearTimeout(trayTimer); trayTimer = setTimeout(() => showTray(b), 350); }
  else if (e.target.closest("#rtray")) clearTimeout(hideTimer);
});
document.addEventListener("mouseout", e => {
  if (!canHover.matches) return;
  if (e.target.closest("[data-rx]") || e.target.closest("#rtray")) { clearTimeout(trayTimer); if (!tray.hidden) hideTray(280); }
});
document.addEventListener("pointerdown", e => {
  const b = e.target.closest("[data-rx]");
  if (b && e.pointerType !== "mouse") { longPressed = false; clearTimeout(pressTimer); pressTimer = setTimeout(() => { longPressed = true; navigator.vibrate?.(12); showTray(b); }, 420); }
  else if (!e.target.closest("#rtray")) hideTray(0);
});
["pointerup", "pointercancel", "pointermove", "scroll"].forEach(ev => document.addEventListener(ev, e => { if (ev !== "pointermove" || e.pointerType !== "mouse") clearTimeout(pressTimer); }, { passive: true }));
document.addEventListener("contextmenu", e => { if (e.target.closest("[data-rx]")) e.preventDefault(); });
document.addEventListener("click", e => {
  const t = e.target.closest("#rtray button");
  if (t && trayFor) { const id = trayFor, k = t.dataset.k, b = trayBtn; hideTray(0); react(id, k); if ((memCache.get(id)?.rx?.[me.uid]) === k) burst(b || t, k); return; }
  const b = e.target.closest("[data-rx]");
  if (b) {
    if (longPressed) { longPressed = false; return; }
    const id = b.dataset.rx, cur = memCache.get(id)?.rx?.[me.uid]; hideTray(0);
    react(id, cur || "like"); if (!cur) burst(b, "like");
  }
}, true);

function memCard(m, isNew) {
  const own = m.authorId === me.uid, u = users.get(m.authorId);
  return `<article class="mem tilt ${isNew ? "new" : ""}">
    <div class="mh">${av(m.authorName, u?.photo, 40)}
      <button class="who" data-act="profile" data-v="${esc(clean(m.authorName))}"><b>${esc(first2(m.authorName))}</b><small>${fmtDate(m.createdAt)}${m.edited ? " · edited" : ""}</small></button>
      ${own ? `<button class="circle dots" data-act="memmenu" data-v="${m.id}" aria-label="Options">${ic("dots")}</button>` : ""}
    </div>
    ${m.caption ? `<p class="cap">${esc(m.caption)}</p>` : ""}
    <button class="pic" data-act="zoom" data-v="${m.id}" aria-label="Open photo"><img src="${esc(m.thumb)}" alt="" loading="lazy"></button>
    ${statsHtml(m)}${actsHtml(m)}
  </article>`;
}
function renderMemories() {
  const box = $("mgrid");
  if (!memories.length) put(box, `<div class="empty-box"><span style="color:var(--g)">${ic("image")}</span><b class="ar" style="color:var(--g2)">لسه مفيش ذكريات. خليك أول واحد!</b><button class="btn primary" data-act="share">${ic("camera")}Share a memory</button></div>`);
  else {
    const html = memories.map(m => { const n = !seenMem.has(m.id) && seenMem.size > 0; return memCard(m, n); }).join("");
    put(box, html); memories.forEach(m => seenMem.add(m.id));
  }
  $("memMore").hidden = memories.length < memLimit;
}
function renderRail() {
  const list = memories.slice(0, 8);
  const html = list.length ? list.map(m => `<button class="mc lift tilt" data-act="zoom" data-v="${m.id}" style="background-image:url('${esc(m.thumb)}')"><span class="t">${esc(m.caption)}</span><span class="by">${av(m.authorName, users.get(m.authorId)?.photo, 24)}<span style="text-transform:capitalize">${esc(first2(m.authorName))}</span></span></button>`).join("")
    : Array.from({ length: 4 }, () => `<button class="mc empty lift" data-act="share">${ic("plus")}<b class="ar" style="color:var(--g2)">شارك أول ذكرى</b></button>`).join("");
  put($("rail"), html);
}
const rail = $("rail"), rtl = () => getComputedStyle(document.documentElement).direction === "rtl";
$("rr").onclick = () => rail.scrollBy({ left: rail.clientWidth * .8 * (rtl() ? -1 : 1), behavior: "smooth" });
$("rl").onclick = () => rail.scrollBy({ left: -rail.clientWidth * .8 * (rtl() ? -1 : 1), behavior: "smooth" });

/* ---------- لايت بوكس بسيط (للـ Journey) ---------- */
function closeLb() { $$(".lb").forEach(l => { l.classList.remove("in"); setTimeout(() => l.remove(), 300); }); }
async function openPhoto(key) {
  const m = memCache.get(key); if (!m) return;
  const u = users.get(m.authorId), txt = m.text || m.caption || "";
  const l = document.createElement("div"); l.className = "lb";
  l.innerHTML = `<button class="circle x" aria-label="Close">${ic("x")}</button><div class="lb-in">${txt ? `<div class="cap">${esc(txt)}</div>` : ""}<img src="${esc(m.thumb)}" alt=""><div class="by">${av(m.authorName, u?.photo, 32)}<span>${esc(first2(m.authorName))}</span></div></div><span class="load">${ic("loader", "spin")}</span>`;
  l.onclick = e => { if (!e.target.closest("img,.by,.cap") || e.target.closest(".x")) closeLb(); };
  document.body.append(l); raf(() => l.classList.add("in"));
  try {
    if (!m.full) { const s = await getDoc(doc(db, m._col || "memories", m.id, "blobs", "full")); if (s.exists()) m.full = s.data().data; }
    if (m.full) l.querySelector("img").src = m.full;
  } catch (e) { console.error(e); }
  l.querySelector(".load")?.remove();
}

/* ---------- عارض الذكرى: كابشن + رياكتات + كومنتات ---------- */
let viewer = null;
function closeViewer(now) {
  if (!viewer) return; const v = viewer; viewer = null; v.unsub?.();
  v.el.classList.remove("in"); document.documentElement.classList.remove("noscroll");
  if (now) v.el.remove(); else setTimeout(() => v.el.remove(), 300);
}
function viewerTop(m) {
  const own = m.authorId === me.uid, u = users.get(m.authorId);
  const cap = viewer.editing
    ? `<div class="capedit"><textarea id="pvCap" rows="3" maxlength="140" dir="auto">${esc(m.caption)}</textarea><div class="pf-act" style="margin:8px 0 0"><button class="btn primary sm" data-act="savecap">${ic("check")}Save</button><button class="btn sm" data-act="cancelcap">Cancel</button></div></div>`
    : (m.caption ? `<p class="cap">${esc(m.caption)}${m.edited ? `<small> · edited</small>` : ""}</p>` : "");
  return `<div class="mh">${av(m.authorName, u?.photo, 42)}<button class="who" data-act="profile" data-v="${esc(clean(m.authorName))}"><b>${esc(first2(m.authorName))}</b><small>${fmtDate(m.createdAt)} · ${fmtTime(m.createdAt)}</small></button>${own && !viewer.editing ? `<button class="circle" data-act="editcap" aria-label="Edit caption" title="Edit caption">${ic("edit")}</button>` : ""}</div>${cap}${statsHtml(m)}${actsHtml(m)}`;
}
function refreshViewer() {
  if (!viewer) return; const m = memCache.get(viewer.id); if (!m) { closeViewer(); return; }
  if (viewer.editing) return;
  put($("pvTop"), viewerTop(m)); renderComments();
}
function renderComments() {
  if (!viewer) return; const m = memCache.get(viewer.id), box = $("pvList"), owner = m?.authorId === me.uid, cs = viewer.comments;
  put(box, cs.length ? cs.map(c => {
    const mine = c.authorId === me.uid, u = users.get(c.authorId);
    return `<div class="cm"><button class="cavb" data-act="profile" data-v="${esc(clean(c.authorName))}">${av(c.authorName, u?.photo, 34)}</button><div class="cbody"><div class="cbub"><b>${esc(first2(c.authorName))}</b><span dir="auto">${esc(c.text)}</span></div><div class="cmeta"><span>${fmtDate(c.createdAt)} · ${fmtTime(c.createdAt)}</span>${mine || owner ? `<button data-act="delcm" data-v="${c.id}">Delete</button>` : ""}</div></div></div>`;
  }).join("") : `<div class="cnone small"><span>${ic("comment")}</span><span class="ar">لسه مفيش تعليقات. كن أول واحد يعلّق 💬</span></div>`);
  if (cs.length > (viewer.prevN || 0)) box.scrollTop = box.scrollHeight; viewer.prevN = cs.length;
}
async function openMemory(id, opts = {}) {
  const m = memCache.get(id); if (!m) return;
  closeViewer(true); closeLb();
  const el = document.createElement("div"); el.className = "pv";
  el.innerHTML = `<button class="circle x" data-pvclose aria-label="Close">${ic("x")}</button><div class="pv-in">
    <div class="pv-img"><img src="${esc(m.thumb)}" alt=""><span class="load">${ic("loader", "spin")}</span></div>
    <div class="pv-side"><div class="pv-top" id="pvTop"></div><div class="pv-list" id="pvList"></div>
      <form class="pv-comp" id="pvComp" autocomplete="off">${av(me.name, me.photo, 34)}<input id="pvIn" maxlength="500" dir="auto" placeholder="Write a comment…  اكتب تعليق"><button class="circle send" aria-label="Send" disabled>${ic("send")}</button></form></div></div>`;
  document.body.append(el); document.documentElement.classList.add("noscroll"); raf(() => el.classList.add("in"));
  viewer = { id, el, comments: [], editing: !!opts.edit, unsub: null, prevN: 0 };
  el.addEventListener("click", e => { if (e.target.closest("[data-pvclose]") || e.target === el || e.target.classList.contains("pv-in")) closeViewer(); });
  const inp = el.querySelector("#pvIn"), send = el.querySelector(".send");
  inp.oninput = () => send.disabled = !inp.value.trim();
  el.querySelector("#pvComp").onsubmit = sendComment;
  put($("pvTop"), viewerTop(m)); renderComments();
  viewer.unsub = onSnapshot(query(collection(db, "memories", id, "comments"), orderBy("createdAt", "asc"), limit(200)), snap => {
    if (!viewer || viewer.id !== id) return;
    viewer.comments = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderComments();
  }, fail);
  if (opts.focus) setTimeout(() => inp.focus(), 350);
  try {
    if (!m.full) { const s = await getDoc(doc(db, "memories", id, "blobs", "full")); if (s.exists()) m.full = s.data().data; }
    if (m.full && viewer?.el === el) el.querySelector(".pv-img img").src = m.full;
  } catch (e) { console.error(e); }
  el.querySelector(".pv-img .load")?.remove();
}
async function sendComment(e) {
  e.preventDefault(); if (!viewer) return;
  const inp = $("pvIn"), text = inp.value.trim(), id = viewer.id; if (!text) return;
  inp.value = ""; $("pvComp").querySelector(".send").disabled = true;
  try {
    await addDoc(collection(db, "memories", id, "comments"), { text, authorId: me.uid, authorName: me.name, createdAt: serverTimestamp() });
    await setDoc(doc(db, "memories", id), { cc: increment(1) }, { merge: true });
  } catch (err) { console.error(err); inp.value = text; $("pvComp").querySelector(".send").disabled = false; toast("التعليق ماتبعتش.", true); }
}
async function deleteComment(cid) {
  if (!viewer || !await confirmBox("تمسح التعليق ده؟")) return; const id = viewer.id;
  try { await deleteDoc(doc(db, "memories", id, "comments", cid)); await setDoc(doc(db, "memories", id), { cc: increment(-1) }, { merge: true }); }
  catch (e) { console.error(e); toast("معرفتش أمسح التعليق.", true); }
}
async function saveCaption() {
  if (!viewer) return; const id = viewer.id, m = memCache.get(id), t = $("pvCap").value.trim(); if (!t) return toast("الكابشن مينفعش يبقى فاضي.", true);
  try { await updateDoc(doc(db, "memories", id), { caption: t, edited: true }); m.caption = t; m.edited = true; viewer.editing = false; renderAll(); refreshViewer(); toast("اتعدّل الكابشن."); }
  catch (e) { console.error(e); toast("معرفتش أعدّل الكابشن.", true); }
}
function openReactors(id) {
  const m = memCache.get(id); if (!m) return;
  const entries = Object.entries(m.rx || {}).filter(([, k]) => k && RXK[k]).map(([uid, k]) => ({ uid, k, u: users.get(uid) }));
  const cn = rxCounts(m), tabs = [["all", entries.length], ...cn.top.map(k => [k, cn.c[k]])];
  const mm = modal(`<h3>Reactions</h3><div class="rtabs">${tabs.map(([k, n], i) => `<button class="rt ${i ? "" : "on"}" data-k="${k}">${k === "all" ? "All" : rxIcon(k, "sm")}<b>${n}</b></button>`).join("")}</div><div class="rlist" id="rList"></div>`);
  const draw = k => { mm.querySelector("#rList").innerHTML = entries.filter(e => k === "all" || e.k === k).map(e => `<button class="rrow" data-act="profile" data-v="${esc(e.u?.key || "")}"><span class="rv">${av(e.u?.name || "?", e.u?.photo, 42)}${rxIcon(e.k, "badge")}</span><b>${esc(title(e.u ? e.u.name : "Unknown"))}</b></button>`).join(""); };
  mm.querySelector(".rtabs").onclick = e => { const b = e.target.closest(".rt"); if (!b) return; mm.querySelectorAll(".rt").forEach(x => x.classList.toggle("on", x === b)); draw(b.dataset.k); };
  draw("all");
}
function memMenu(id) {
  const m = modal(`<h3>Options</h3><div class="optlist"><button class="btn full" data-ed>${ic("edit")}Edit caption · تعديل الكابشن</button><button class="btn full" data-del style="color:var(--danger)">${ic("trash")}Delete · مسح الذكرى</button></div>`);
  m.querySelector("[data-ed]").onclick = () => { m.close(); openMemory(id, { edit: true }); };
  m.querySelector("[data-del]").onclick = () => { m.close(); deleteMemory(id); };
}

/* ---------- رفع ميموري ---------- */
function openUpload() {
  let full = "", thumb = "";
  const m = modal(`<h3>Share a memory</h3><p class="ar" style="opacity:.75;font-size:.9rem">اختار صورة واكتب كابشن. الكابشن بيظهر فوق الصورة واسمك تحتها.</p>
    <form id="upForm">
      <label class="drop" id="upDrop">${ic("upload")}<b style="color:var(--g2)">Choose a photo</b><span class="hint ar">أو اسحبها هنا</span><input id="upFile" type="file" accept="image/*" hidden></label>
      <div class="prev" id="upPrev" hidden><img alt=""><button type="button" class="circle" id="upClr" aria-label="Remove">${ic("x")}</button></div>
      <div class="field"><div class="lbl"><label for="upCap">Caption · الكابشن</label><span id="upCount">0/140</span></div><textarea id="upCap" rows="2" maxlength="140" dir="auto" required placeholder="اكتب كابشن للصورة…"></textarea></div>
      <div class="postas">${av(me.name, me.photo, 36)}<span>Posting as <b>${esc(first2(me.name))}</b><br><small class="ar" style="opacity:.65">اسمك بيظهر تحت الصورة دايمًا</small></span>${ic("lock")}</div>
      <div class="err ar" id="upErr"></div>
      <button class="btn primary full" id="upGo" type="submit" disabled>${ic("send")}<span>Share</span></button>
    </form>`);
  const f = m.querySelector("#upFile"), go = m.querySelector("#upGo");
  const sync = () => go.disabled = !(full && m.querySelector("#upCap").value.trim());
  const take = async file => {
    if (!file || !file.type.startsWith("image/")) return;
    m.querySelector("#upErr").textContent = "";
    try {
      [full, thumb] = await Promise.all([resizeFit(file, 1400, .78), resizeFit(file, 480, .72)]);
      m.querySelector("#upPrev img").src = thumb; m.querySelector("#upPrev").hidden = false; m.querySelector("#upDrop").hidden = true; sync();
    } catch { m.querySelector("#upErr").textContent = "الصورة دي مش مدعومة. جرب JPG أو PNG."; }
  };
  f.onchange = () => take(f.files[0]);
  const d = m.querySelector("#upDrop");
  ["dragover", "dragenter"].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove("over"); }));
  d.addEventListener("drop", e => take(e.dataTransfer.files[0]));
  m.querySelector("#upClr").onclick = () => { full = thumb = ""; f.value = ""; m.querySelector("#upPrev").hidden = true; d.hidden = false; sync(); };
  m.querySelector("#upCap").oninput = e => { m.querySelector("#upCount").textContent = e.target.value.length + "/140"; sync(); };
  m.querySelector("#upForm").onsubmit = async e => {
    e.preventDefault(); go.disabled = true; go.innerHTML = ic("loader", "spin") + "<span>Uploading…</span>";
    try {
      const ref = await addDoc(collection(db, "memories"), { caption: m.querySelector("#upCap").value.trim(), thumb, authorId: me.uid, authorName: me.name, createdAt: serverTimestamp() });
      try { await setDoc(doc(db, "memories", ref.id, "blobs", "full"), { data: full }); }
      catch (err) { await deleteDoc(ref); throw err; }
      toast("اتشاركت الذكرى ✨"); m.close(); location.hash = "#memories";
    } catch (err) { console.error(err); m.querySelector("#upErr").textContent = "مقدرتش أرفع الصورة: " + (err.code || err.message); go.disabled = false; go.innerHTML = ic("send") + "<span>Share</span>"; }
  };
}
async function deleteMemory(id) {
  if (!await confirmBox("تمسح الذكرى دي؟")) return;
  try {
    if (viewer?.id === id) closeViewer();
    try { const cs = await getDocs(collection(db, "memories", id, "comments")); await Promise.all(cs.docs.map(d => deleteDoc(doc(db, "memories", id, "comments", d.id)).catch(() => { }))); } catch (e) { }
    await deleteDoc(doc(db, "memories", id, "blobs", "full")).catch(() => { }); await deleteDoc(doc(db, "memories", id)); memCache.delete(id); toast("اتمسحت.");
  } catch (e) { console.error(e); toast("معرفتش أمسحها.", true); }
}

/* =========================================================
   Our Journey: كل سنة فيها صور وذكريات وأحداث الدفعة بتضيفها
   ========================================================= */
let journey = [], yearOpen = null;
function listenJourney() {
  unsubs.push(onSnapshot(query(collection(db, "journey"), orderBy("createdAt", "desc"), limit(300)), snap => {
    journey = snap.docs.map(d => ({ id: d.id, _col: "journey", ...d.data() }));
    journey.forEach(j => memCache.set("j:" + j.id, j));
    renderJourney(); fillYear();
  }, fail));
}
function renderJourney() {
  const el = $("pk"); if (!el) return;
  const cnt = i => journey.filter(j => j.year === i).length + JOURNEY[i].photos.length;
  const cover = i => { const j = journey.find(x => x.year === i && x.thumb); return j ? j.thumb : (JOURNEY[i].photos[0] || ""); };
  const sig = JSON.stringify(JOURNEY.map((y, i) => [cover(i).length, cnt(i)]));
  if (renderJourney.sig === sig) return; renderJourney.sig = sig;
  el.innerHTML = `<div class="lead pin"><div><div class="eyebrow">2022 — 2028</div><h2 style="margin-top:10px">Five years, <em>one story</em></h2><p class="ar">من أول يوم لحد التخرج. دوس على أي سنة، شوف اللي حصل فيها وضيف صورك وذكرياتك وأحداث السنة دي.</p></div>${ic("route", "lg")}</div>` +
    JOURNEY.map((y, i) => { const c = cover(i), n = cnt(i); return `<button class="yr lift tilt pin" data-yr="${i}" style="--d:${.06 * (i + 1)}s${c ? `;background-image:url('${esc(c)}')` : ""}"><span class="big">${i + 1}</span><span class="badge2">${ic(["cap", "flask", "pill", "users", "sparkles"][i % 5])}</span><small>${esc(y.year)} · ${esc(y.date)}</small><h3>${esc(y.title)}</h3><p class="ar">${esc(y.text)}</p><span class="cnt">${ic("image")}${n} ${n === 1 ? "moment" : "moments"}</span></button>`; }).join("");
}
function openYear(i) {
  const y = JOURNEY[i];
  const m = modal(`<div class="eyebrow">${esc(y.year)} · ${esc(y.date)}</div><h3 style="margin-top:8px;font-size:1.9rem">${esc(y.title)}</h3><p class="ar" style="opacity:.85">${esc(y.text)}</p>
    <div class="pf-act"><button class="btn primary" data-act="jadd" data-v="${i}">${ic("plus")}Add to ${esc(y.year)} · ضيف ذكرى</button></div><div class="jlist" id="jList"></div>`, "wide");
  yearOpen = { i, m }; fillYear();
}
function fillYear() {
  if (!yearOpen) return;
  if (!document.body.contains(yearOpen.m)) { yearOpen = null; return; }
  const i = yearOpen.i, y = JOURNEY[i];
  const list = journey.filter(j => j.year === i).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  const html = list.map(j => {
    const u = users.get(j.authorId), own = j.authorId === me.uid;
    return `<article class="jit">${j.thumb ? `<button class="jpic" data-act="zoomj" data-v="${j.id}" aria-label="Open photo"><img src="${esc(j.thumb)}" alt="" loading="lazy"></button>` : ""}
      <div class="jtx">${j.text ? `<p dir="auto">${esc(j.text)}</p>` : ""}<div class="by">${av(j.authorName, u?.photo, 30)}<span><b>${esc(first2(j.authorName))}</b><small>${fmtDate(j.createdAt)}</small></span>${own ? `<button class="circle" data-act="deljit" data-v="${j.id}" aria-label="Delete" style="width:34px;height:34px;margin-inline-start:auto">${ic("trash")}</button>` : ""}</div></div></article>`;
  }).join("") + (y.photos.length ? `<div class="ph">${y.photos.map(p => `<img src="${esc(p)}" alt="" loading="lazy">`).join("")}</div>` : "");
  put(yearOpen.m.querySelector("#jList"), html || `<div class="empty-box" style="padding:30px 14px"><span style="color:var(--g)">${ic("sparkles")}</span><b class="ar" style="color:var(--g2)">لسه مفيش حاجة في السنة دي. ضيف أول ذكرى!</b></div>`);
}
function openJourneyAdd(i) {
  let full = "", thumb = ""; const y = JOURNEY[i];
  const m = modal(`<h3>Add to ${esc(y.year)}</h3><p class="ar" style="opacity:.75;font-size:.9rem">احكي اللي حصل في السنة دي، وضيف صورة لو عايز (اختياري).</p>
    <form id="jForm">
      <label class="drop" id="jDrop">${ic("upload")}<b style="color:var(--g2)">Add a photo · صورة (اختياري)</b><input id="jFile" type="file" accept="image/*" hidden></label>
      <div class="prev" id="jPrev" hidden><img alt=""><button type="button" class="circle" id="jClr" aria-label="Remove">${ic("x")}</button></div>
      <div class="field"><div class="lbl"><label for="jTxt">What happened? · اللي حصل</label><span id="jCnt">0/600</span></div><textarea id="jTxt" rows="4" maxlength="600" dir="auto" placeholder="مثلاً: أول محاضرة، رحلة، امتحان مش هنساه…"></textarea></div>
      <div class="postas">${av(me.name, me.photo, 36)}<span>Posting as <b>${esc(first2(me.name))}</b></span>${ic("lock")}</div>
      <div class="err ar" id="jErr"></div>
      <button class="btn primary full" id="jGo" type="submit" disabled>${ic("send")}<span>Add</span></button>
    </form>`);
  const go = m.querySelector("#jGo"), txt = m.querySelector("#jTxt"), sync = () => go.disabled = !(full || txt.value.trim());
  const take = async file => {
    if (!file || !file.type.startsWith("image/")) return;
    try { [full, thumb] = await Promise.all([resizeFit(file, 1400, .78), resizeFit(file, 480, .72)]); m.querySelector("#jPrev img").src = thumb; m.querySelector("#jPrev").hidden = false; m.querySelector("#jDrop").hidden = true; sync(); }
    catch { m.querySelector("#jErr").textContent = "الصورة دي مش مدعومة. جرب JPG أو PNG."; }
  };
  m.querySelector("#jFile").onchange = e => take(e.target.files[0]);
  m.querySelector("#jClr").onclick = () => { full = thumb = ""; m.querySelector("#jFile").value = ""; m.querySelector("#jPrev").hidden = true; m.querySelector("#jDrop").hidden = false; sync(); };
  txt.oninput = () => { m.querySelector("#jCnt").textContent = txt.value.length + "/600"; sync(); };
  m.querySelector("#jForm").onsubmit = async e => {
    e.preventDefault(); go.disabled = true; go.innerHTML = ic("loader", "spin") + "<span>Saving…</span>";
    try {
      const ref = await addDoc(collection(db, "journey"), { year: i, text: txt.value.trim(), thumb, authorId: me.uid, authorName: me.name, createdAt: serverTimestamp() });
      if (full) { try { await setDoc(doc(db, "journey", ref.id, "blobs", "full"), { data: full }); } catch (err) { await deleteDoc(ref); throw err; } }
      toast("اتضافت للسنة ✨"); m.close();
    } catch (err) { console.error(err); m.querySelector("#jErr").textContent = "معرفتش أحفظ: " + (err.code || err.message); go.disabled = false; go.innerHTML = ic("send") + "<span>Add</span>"; }
  };
}
async function deleteJourneyItem(id) {
  if (!await confirmBox("تمسح الذكرى دي من السنة؟")) return;
  try { await deleteDoc(doc(db, "journey", id, "blobs", "full")).catch(() => { }); await deleteDoc(doc(db, "journey", id)); toast("اتمسحت."); }
  catch (e) { console.error(e); toast("معرفتش أمسحها.", true); }
}

/* =========================================================
   Get started: كل خطوة بتختفي لما تخلصها
   ========================================================= */
function renderSteps() {
  const sec = $("steps"); if (!sec || !me) return;
  const ready = flags.mem && flags.chats;
  const done = { edit: !!me.photo, share: myMemCount > 0, chat: chats.length > 0 };
  let n = 0;
  $$(".step", sec).forEach(b => { const hide = !ready || done[b.dataset.act]; b.hidden = hide; if (!hide) { n++; b.querySelector(".n").textContent = n; } });
  sec.hidden = !ready || n === 0;
  $("stepsTitle").innerHTML = n >= 3 ? "Pharmily is easy as <em>1-2-3</em>" : n === 2 ? "Two steps <em>to go</em>" : "One step <em>to go</em>";
}

/* =========================================================
   البروفايل
   ========================================================= */
async function openProfile(key) {
  const p = PBYKEY.get(key); if (!p) return;
  const u = usersByKey.get(key), isMe = u && u.uid === me.uid;
  const nick = u?.nickname || p.nickname, bio = u?.bio || "";
  const m = modal(`<div class="pf-top">${av(p.name, u?.photo || p.photo, 104)}<div style="flex:1;min-width:180px"><h3>${esc(title(p.name))}</h3>
      ${nick ? `<span class="chip" style="margin-top:6px">${esc(nick)}</span>` : ""}${bio ? `<p class="bio">${esc(bio)}</p>` : ""}
      <div class="hint" style="margin-top:8px">${u ? `${ic("users")} Joined ${fmtDate(u.createdAt)}` : "Not joined yet"}</div></div></div>
    <div class="pf-act">
      ${isMe ? `<button class="btn primary" data-act="edit">${ic("edit")}Edit profile</button><button class="btn" data-act="logout">${ic("logout")}Sign out</button>`
      : u ? `<button class="btn primary" data-act="chat" data-v="${u.uid}">${ic("message")}Message</button>`
        : `<span class="hint ar">لسه ماسجلش. أول ما يسجل تقدر تبعتله رسالة.</span>`}
    </div>
    ${u ? `<div class="pf-sec"><h4>Memories</h4><div class="mini" id="pfMem"><span class="hint">${ic("loader", "spin")}</span></div></div>` : ""}`, "wide");
  if (!u) return;
  try {
    const s = await getDocs(query(collection(db, "memories"), where("authorId", "==", u.uid)));
    const list = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
    list.forEach(x => memCache.set(x.id, x));
    const box = m.querySelector("#pfMem"); if (!box) return;
    box.innerHTML = list.length ? list.map(x => `<button data-act="zoom" data-v="${x.id}"><img src="${esc(x.thumb)}" alt=""></button>`).join("") : `<span class="hint ar">مفيش ذكريات لسه.</span>`;
  } catch (e) { console.error(e); }
}
function openEdit() {
  let photo = me.photo || "", changed = false;
  const m = modal(`<h3>Edit profile</h3><form id="edForm">
    <div class="pick"><button type="button" class="av ${photo ? "has" : ""}" id="edBtn" style="--sz:84px"><span id="edIni">${photo ? `<img src="${esc(photo)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : esc(initials(me.name))}</span><span class="cam">${ic("camera")}</span></button>
      <div><b style="color:var(--g2)">${esc(title(me.name))}</b><div class="hint ar">الاسم ثابت زي الشيت</div><button type="button" class="btn sm" id="edRm" style="margin-top:6px">Remove photo</button></div><input id="edFile" type="file" accept="image/*" hidden></div>
    <div class="field"><label for="edNick">Nickname · اللقب</label><input id="edNick" maxlength="30" dir="auto" value="${esc(me.nickname || "")}"></div>
    <div class="field"><div class="lbl"><label for="edBio">Bio · نبذة</label><span id="edCnt"></span></div><textarea id="edBio" rows="3" maxlength="160" dir="auto">${esc(me.bio || "")}</textarea></div>
    <div class="err ar" id="edErr"></div><button class="btn primary full" type="submit">${ic("check")}Save</button></form>`);
  const bio = m.querySelector("#edBio"), cnt = () => m.querySelector("#edCnt").textContent = bio.value.length + "/160"; cnt(); bio.oninput = cnt;
  m.querySelector("#edBtn").onclick = () => m.querySelector("#edFile").click();
  m.querySelector("#edFile").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { photo = await resizeSquare(f, 160, .8); changed = true; m.querySelector("#edBtn").classList.add("has"); m.querySelector("#edIni").innerHTML = `<img src="${photo}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`; }
    catch { m.querySelector("#edErr").textContent = "الصورة دي مش مدعومة."; }
  };
  m.querySelector("#edRm").onclick = () => { photo = ""; changed = true; m.querySelector("#edBtn").classList.remove("has"); m.querySelector("#edIni").textContent = initials(me.name); };
  m.querySelector("#edForm").onsubmit = async e => {
    e.preventDefault();
    try { await updateDoc(doc(db, "users", me.uid), { nickname: m.querySelector("#edNick").value.trim(), bio: bio.value.trim(), photo }); toast("اتحفظ."); m.close(); }
    catch (err) { console.error(err); m.querySelector("#edErr").textContent = "معرفتش أحفظ: " + (err.code || err.message); }
  };
}

/* ---------- بحث الـ nav ---------- */
$("gs").oninput = e => {
  const k = clean(e.target.value), pop = $("gsPop");
  if (!k) { pop.hidden = true; return; }
  const r = PEOPLE.filter(p => p.key.includes(k)).slice(0, 7);
  pop.innerHTML = r.length ? r.map(p => { const u = usersByKey.get(p.key); return `<button class="row" data-act="profile" data-v="${esc(p.key)}">${av(p.name, u?.photo || p.photo, 30)}<span style="text-transform:capitalize">${esc(first2(p.name))}</span><small>${u ? "joined" : "—"}</small></button>`; }).join("") : `<div class="row hint">No results</div>`;
  pop.hidden = false;
};

/* =========================================================
   الشات
   ========================================================= */
const cid = (a, b) => [a, b].sort().join("_");
function onChats(snap) {
  const first = !chats.length && !onChats.ready; onChats.ready = true; flags.chats = true;
  snap.docChanges().forEach(c => {
    if (first || c.type === "removed") return;
    const d = c.doc.data();
    if (d.lastFrom && d.lastFrom !== me.uid && (d.unread?.[me.uid] || 0) > 0 && !(current && cid(me.uid, current) === c.doc.id && !$("chat").hidden)) {
      const o = users.get(d.members.find(x => x !== me.uid)); toast(`رسالة جديدة من ${first2(o?.name || "زميل")}`);
    }
  });
  chats = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b.updatedAt) - ms(a.updatedAt));
  attachThread(); renderAll();
  const tot = chats.reduce((n, c) => n + (c.unread?.[me.uid] || 0), 0);
  $("msgBadge").hidden = !tot; $("msgBadge").textContent = tot > 9 ? "9+" : tot;
  markRead();
}
function renderChatList() {
  const list = $("cList"); if (!list) return;
  put(list, chats.length ? chats.map(c => {
    const oid = c.members.find(x => x !== me.uid), o = users.get(oid), n = c.unread?.[me.uid] || 0;
    return `<button class="crow ${current === oid ? "on" : ""}" data-act="chat" data-v="${oid}">${av(o?.name || "?", o?.photo, 44)}<span class="tx"><b>${esc(first2(o?.name || "?"))}</b><small>${c.lastFrom === me.uid ? "You: " : ""}${esc(c.lastMsg || "")}</small></span>${n ? `<span class="n">${n}</span>` : ""}</button>`;
  }).join("") : `<div class="cnone"><span>${ic("message")}</span><span class="ar">مفيش رسايل لسه.<br>دوس + وابدأ محادثة.</span></div>`);
}
function openChat(uid) {
  const c = $("chat");
  if (c.hidden) { c.hidden = false; raf(() => c.classList.add("in")); }
  document.querySelectorAll(".modal").forEach(m => m.close?.());
  if (uid && uid !== me.uid) { current = uid; $("cbox").classList.add("thread"); threadFor = null; attachThread(); renderThread(); markRead(); }
  else { current = null; $("cbox").classList.remove("thread"); renderThread(); }
  renderChatList();
}
function closeChat() { const c = $("chat"); c.classList.remove("in"); setTimeout(() => c.hidden = true, 300); }
$("cClose").onclick = closeChat;
$("chat").addEventListener("mousedown", e => { if (e.target === $("chat")) closeChat(); });

function attachThread() {
  if (!current) { threadUnsub?.(); threadUnsub = null; threadFor = null; return; }
  const id = cid(me.uid, current);
  if (threadFor === id) return;
  if (!chats.find(c => c.id === id)) { threadUnsub?.(); threadUnsub = null; threadMsgs = []; threadFor = null; return; } // لسه مفيش محادثة
  threadUnsub?.(); threadFor = id; threadMsgs = [];
  threadUnsub = onSnapshot(query(collection(db, "chats", id, "messages"), orderBy("createdAt", "desc"), limit(100)), s => {
    threadMsgs = s.docs.map(d => ({ id: d.id, ...d.data() })).reverse(); renderThread(true); markRead();
  }, fail);
}
function renderThreadHead() { if (current && !$("chat").hidden) renderThread(); }
function renderThread(stick) {
  const box = $("cThread"), o = users.get(current);
  if (!current || !o) { box._h = ""; box.innerHTML = `<div class="cnone"><span>${ic("message")}</span><span class="ar">اختار محادثة أو دوس + علشان تبدأ واحدة جديدة.</span></div>`; box._cur = null; return; }
  if (box._cur !== current) {
    box._cur = current;
    box.innerHTML = `<div class="cth-h"><button class="circle back" id="cBack" aria-label="Back">${ic("arrow-l")}</button><span id="cav"></span><span class="who"><b id="cnm"></b><small id="cnk"></small></span><button class="circle" data-act="profile" data-v="${esc(o.key)}" aria-label="Profile">${ic("user")}</button></div>
      <div class="msgs" id="msgs"></div>
      <form class="comp" id="comp"><textarea id="ctx" rows="1" dir="auto" maxlength="1000" placeholder="Write a message…"></textarea><button class="circle" style="background:var(--g);color:var(--onacc)" aria-label="Send">${ic("send")}</button></form>`;
    $("cBack").onclick = () => { current = null; $("cbox").classList.remove("thread"); renderChatList(); };
    $("comp").onsubmit = sendMsg;
    $("ctx").onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(e); } };
    $("ctx").oninput = e => { e.target.style.height = "auto"; e.target.style.height = Math.min(120, e.target.scrollHeight) + "px"; };
    stick = true; $("ctx").focus();
  }
  put($("cav"), av(o.name, o.photo, 40)); $("cnm").textContent = first2(o.name); $("cnk").textContent = o.nickname || "";
  const ml = $("msgs"), near = ml.scrollHeight - ml.scrollTop - ml.clientHeight < 120;
  put(ml, threadMsgs.length ? threadMsgs.map(m => `<div class="bub ${m.from === me.uid ? "me" : "you"}">${esc(m.text)}<small>${fmtTime(m.createdAt)}</small></div>`).join("") : `<div class="cnone"><span>${ic("sparkles")}</span><span class="ar">قول Hi لـ ${esc(first2(o.name))} 👋</span></div>`);
  if (stick || near) ml.scrollTop = ml.scrollHeight;
}
let sending = false;
async function sendMsg(e) {
  e.preventDefault(); const t = $("ctx"), text = t.value.trim(); if (!text || sending || !current) return;
  sending = true; t.value = ""; t.style.height = "auto";
  const id = cid(me.uid, current), ref = doc(db, "chats", id);
  try {
    await setDoc(ref, { members: [me.uid, current].sort(), updatedAt: serverTimestamp(), lastMsg: text.slice(0, 80), lastFrom: me.uid, unread: { [current]: increment(1) } }, { merge: true });
    await addDoc(collection(ref, "messages"), { from: me.uid, text, createdAt: serverTimestamp() });
  } catch (err) { console.error(err); t.value = text; toast("الرسالة ماتبعتتش.", true); }
  sending = false;
}
function markRead() {
  if (!current || $("chat").hidden) return;
  const c = chats.find(x => x.id === cid(me.uid, current));
  if (c && (c.unread?.[me.uid] || 0) > 0) setDoc(doc(db, "chats", c.id), { unread: { [me.uid]: 0 } }, { merge: true }).catch(() => { });
}
$("cNew").onclick = () => {
  const box = $("cList"); box._h = "";
  const others = [...users.values()].filter(u => u.uid !== me.uid).sort((a, b) => a.name.localeCompare(b.name));
  box.innerHTML = `<div class="field" style="padding:4px 6px 8px"><input id="cSearch" placeholder="Search a classmate…" autocomplete="off"></div><div id="cPick" style="display:grid;gap:4px"></div>`;
  const draw = () => { const k = clean($("cSearch").value); $("cPick").innerHTML = others.filter(u => u.key.includes(k)).map(u => `<button class="crow" data-act="chat" data-v="${u.uid}">${av(u.name, u.photo, 40)}<span class="tx"><b>${esc(first2(u.name))}</b><small>${esc(u.nickname || "")}</small></span></button>`).join("") || `<div class="hint ar" style="padding:10px">مفيش حد بالاسم ده سجّل لسه.</div>`; };
  $("cSearch").oninput = draw; draw(); $("cSearch").focus();
};

/* =========================================================
   Future Me
   ========================================================= */
function renderFuture(list) {
  list.sort((a, b) => a.unlock - b.unlock);
  put($("fl"), list.map(m => Date.now() >= m.unlock ? `<div class="fut">${ic("sparkles")}<span>${esc(m.text)}</span></div>` : `<div class="fut">${ic("lock")}<span class="ar">مقفولة · فاضل ${Math.ceil((m.unlock - Date.now()) / 864e5)} يوم</span></div>`).join(""));
}
$("sv").onclick = async () => {
  const t = $("fm").value.trim(); if (!t || !me) return;
  const d = new Date(); d.setFullYear(d.getFullYear() + FUTURE_YEARS);
  try { await addDoc(collection(db, "users", me.uid, "future"), { text: t.slice(0, 2000), unlock: d.getTime(), createdAt: serverTimestamp() }); $("fm").value = ""; toast("اتقفلت لحد " + d.getFullYear()); }
  catch (e) { console.error(e); toast("معرفتش أحفظها.", true); }
};

/* =========================================================
   أحداث عامة
   ========================================================= */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act]");
  if (!e.target.closest(".search")) $("gsPop").hidden = true;
  if (!e.target.closest("#meBtn,#menu")) $("menu").hidden = true;
  if (e.target.closest(".links a")) $("nav").classList.remove("open");
  if (!t) return;
  const v = t.dataset.v; $("menu").hidden = true; $("gsPop").hidden = true;
  switch (t.dataset.act) {
    case "share": openUpload(); break;
    case "zoom": if (viewer && viewer.id === v) { $("pvIn")?.focus(); } else openMemory(v, { focus: !!t.dataset.focus }); break;
    case "zoomj": openPhoto("j:" + v); break;
    case "memmenu": memMenu(v); break;
    case "rxlist": openReactors(v); break;
    case "editcap": if (viewer) { viewer.editing = true; put($("pvTop"), viewerTop(memCache.get(viewer.id))); $("pvCap")?.focus(); } break;
    case "cancelcap": if (viewer) { viewer.editing = false; refreshViewer(); } break;
    case "savecap": saveCaption(); break;
    case "delcm": deleteComment(v); break;
    case "jadd": openJourneyAdd(+v); break;
    case "deljit": deleteJourneyItem(v); break;
        case "profile": $$(".modal").forEach(m => m.close()); openProfile(v); break;
    case "profile-me": openProfile(me.key); break;
    case "edit": $$(".modal").forEach(m => m.close()); openEdit(); break;
    case "chat": openChat(v); break;
    case "logout": $$(".modal").forEach(m => m.close()); closeChat(); closeViewer(true); signOut(auth); break;
  }
});
$("meBtn").onclick = () => $("menu").hidden = !$("menu").hidden;
$("burger").onclick = () => $("nav").classList.toggle("open");

function moveInd() {
  const tb = document.getElementById("tabbar");
  if (tb) {
    let dot = tb.querySelector(".tab-ind"); if (!dot) { dot = document.createElement("span"); dot.className = "tab-ind"; tb.append(dot); }
    const t = tb.querySelector("a.on");
    if (t && t.offsetWidth) { dot.style.transform = `translateX(${t.offsetLeft + t.offsetWidth / 2 - 3}px)`; dot.style.opacity = 1; } else dot.style.opacity = 0;
  }
  const box = document.querySelector(".links"); if (!box) return;
  let ind = box.querySelector(".ind"); if (!ind) { ind = document.createElement("span"); ind.className = "ind"; box.prepend(ind); }
  const on = box.querySelector("a.on"); if (!on || !on.offsetWidth) { ind.style.opacity = 0; return; }
  ind.style.width = on.offsetWidth + "px"; ind.style.transform = `translateX(${on.offsetLeft}px)`; ind.style.opacity = 1;
}
addEventListener("resize", () => moveInd()); setTimeout(moveInd, 600); document.fonts?.ready.then(() => moveInd());
$("sbtn").onclick = () => { const n = $("nav"); n.classList.toggle("searching"); if (n.classList.contains("searching")) $("gs").focus(); };

let inited = false;
function initStatic() {
  if (inited) return; inited = true;
  {
    const lt = $("lt"); lt.textContent = "";
    (Array.isArray(LETTER) ? LETTER : [LETTER]).forEach(t => { const p = document.createElement("p"); p.textContent = t; lt.appendChild(p); });
    if (typeof LETTER_SIGN === "string" && LETTER_SIGN) { const s = document.createElement("p"); s.className = "sign"; s.textContent = LETTER_SIGN; lt.appendChild(s); }
    const tg = $("ltToggle");
    if (tg) tg.onclick = () => { const open = lt.classList.toggle("open"); tg.textContent = open ? "إخفاء الرسالة ▲" : "اقرأ الرسالة كاملة ▼"; if (!open) lt.scrollIntoView({block:"nearest"}); };
  } $("fy").textContent = FUTURE_YEARS;
  $("mq").textContent = ("FIRST LECTURES · WHITE COATS · LATE-NIGHT LABS · EXAM SEASONS · LIFELONG FRIENDS · ONE FAMILY · ").repeat(6);

  // غلاف اختياري
  if (typeof HERO_PHOTO === "string" && HERO_PHOTO) {
    const i = new Image(); i.onload = () => { const a = $("heroArt"); a.innerHTML = `<div class="photo" style="background-image:url('${HERO_PHOTO}')"></div>`; }; i.src = HERO_PHOTO;
  }
  // Journey (بيترسم من renderJourney)
  renderJourney();
  $("pk").onclick = e => { const b = e.target.closest("[data-yr]"); if (b) openYear(+b.dataset.yr); };
  // reveal + scroll-spy
  const io = new IntersectionObserver(es => es.forEach(x => x.isIntersecting && x.target.classList.add("in")), { threshold: .12 });
  $$(".rv").forEach(el => io.observe(el));
  // تحديد القسم النشط من مكان السكرول (بيحرّك النقطة في الشريط السفلي والمؤشر في الشريط العلوي)
  const secs = ["home", "memories", "meet", "journey", "future"].map(id => $(id)).filter(Boolean);
  let curSec = "", lockUntil = 0, tickS = false;
  const setActive = id => {
    if (id === curSec) return; curSec = id;
    $$(".links a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + id));
    $$("#tabbar a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + id));
    moveInd();
  };
  const spyNow = () => {
    if (Date.now() < lockUntil) return;
    const line = innerHeight * .4; let id = secs[0].id;
    for (const s of secs) if (s.getBoundingClientRect().top <= line) id = s.id;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 6) id = secs[secs.length - 1].id;
    setActive(id);
  };
  addEventListener("scroll", () => { if (!tickS) { tickS = true; requestAnimationFrame(() => { tickS = false; spyNow(); }); } }, { passive: true });
  document.addEventListener("click", e => {   // لما تدوسي على تبويب: النقطة تروحله فورًا
    const l = e.target.closest("#tabbar a, .links a"); if (!l) return;
    const id = (l.getAttribute("href") || "").slice(1); if (secs.some(s => s.id === id)) { lockUntil = Date.now() + 900; setActive(id); setTimeout(spyNow, 950); }
  });
  spyNow();
}
})();
