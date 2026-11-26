/* =========================================================
   PHARMILY 16 — app.js  (الأساس: دخول، nav، ناس، شات، Future Me، خطوات البداية)
   الميموريز + الرياكتات + الكومنتات + Journey في posts.js
   الحركات بالماوس في fx.js
   ========================================================= */
(() => {
const FB = window.PH_FB;
const { setPersistence, browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  doc, collection, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, increment } = FB;

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
const ago = t => { const s = Math.max(0, (Date.now() - ms(t)) / 1000); if (s < 45) return "now"; if (s < 3600) return Math.round(s / 60) + "m"; if (s < 86400) return Math.round(s / 3600) + "h"; if (s < 604800) return Math.round(s / 86400) + "d"; return fmtDate(t); };
const put = (el, html) => { if (el._h !== html) { el._h = html; el.innerHTML = html; } };
const raf = fn => requestAnimationFrame(fn);

/* ---------- الطلبة (من data.js) ---------- */
// الصورة الثابتة للكارت: بتتدور عليها في فولدر photos بعدة أسماء وامتدادات (الأول اللي يتلاقى)
const EXTS = ["jpg", "jpeg", "png", "webp", "JPG", "PNG"];
const PEOPLE = STUDENTS.map((s, i) => {
  const key = clean(s.name), c = [];
  if (s.photo && !/^photos\/\d+\.jpg$/.test(s.photo)) c.push(s.photo);
  EXTS.forEach(e => c.push(`photos/${i + 1}.${e}`));
  c.push(`photos/${slug(key).replace(/\./g, "-")}.jpg`);
  return { name: s.name, key, nickname: s.nickname || "", cands: [...new Set(c)] };
});
const PBYKEY = new Map(PEOPLE.map(p => [p.key, p]));
// لو صورة مش موجودة يجرب الاسم اللي بعده، ولو خلصوا يشيل الصورة ويفضل الحروف
document.addEventListener("error", e => {
  const i = e.target; if (!i || i.tagName !== "IMG" || !i.dataset.c) return;
  const list = i.dataset.c.split("|"), n = (+i.dataset.i || 0) + 1;
  if (n < list.length) { i.dataset.i = n; i.src = list[n]; } else i.remove();
}, true);

/* ---------- Firebase ---------- */
const CONFIGURED = !!FB.ready;
const auth = FB.auth, db = FB.db;
if (FB.demo) $("demoBar").hidden = false;

/* ---------- الحالة ---------- */
let me = null, registering = false, started = false, usersLoaded = false;
const users = new Map(), usersByKey = new Map();
let chats = [], current = null, threadUnsub = null, threadMsgs = [], threadFor = null;
let unsubs = [], filterJoined = false, page = 1;
const state = { hasMem: false, memReady: false };

/* =========================================================
   UI: toast / modal / confirm
   ========================================================= */
function toast(msg, bad) {
  const t = document.createElement("div");
  t.className = "toast" + (bad ? " bad" : "");
  t.innerHTML = ic(bad ? "x" : "check") + `<span>${esc(msg)}</span>`;
  $("toasts").append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 3200);
}
function modal(html, cls = "", onClose) {
  const el = document.createElement("div");
  el.className = "modal";
  el.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true"><div class="grab"></div><button class="circle x" data-close aria-label="Close">${ic("x")}</button>${html}</div>`;
  let closed = false;
  const close = () => {
    if (closed) return; closed = true; el.classList.remove("in"); el.classList.add("closing"); onClose && onClose();
    setTimeout(() => { el.remove(); if (!$$(".modal").length) document.body.classList.remove("lock"); }, 320);
  };
  el.addEventListener("mousedown", e => { if (e.target === el) close(); });
  el.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
  el.close = close;
  document.body.append(el); document.body.classList.add("lock");
  raf(() => el.classList.add("in"));
  return el;
}
const closeModals = () => $$(".modal:not(.closing)").forEach(m => m.close());
const confirmBox = msg => new Promise(res => {
  let done = false; const fin = v => { if (!done) { done = true; res(v); } };
  const m = modal(`<h3>Are you sure?</h3><p class="ar" style="opacity:.8">${esc(msg)}</p><div class="pf-act"><button class="btn primary" data-y>Yes · أيوه</button><button class="btn" data-close>Cancel</button></div>`, "small", () => fin(false));
  m.querySelector("[data-y]").onclick = () => { fin(true); m.close(); };
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if ($$(".lb").length) return $$(".lb").forEach(l => l.click());
  const m = $$(".modal:not(.closing)").pop(); if (m) return m.close();
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
// صورة الكارت الثابتة (من فولدر photos)
const cardImg = (p, size = "") => `<img src="${esc(p.cands[0])}" data-c="${p.cands.map(esc).join("|")}" data-i="0" alt="" loading="lazy">`;

/* =========================================================
   شاشة التسجيل / الدخول
   ========================================================= */
const showAuth = () => { $("splash").classList.add("off"); $("app").hidden = true; $("partyBtn").hidden = true; $("tabbar").hidden = true; $("auth").hidden = false; };
const authErr = (id, m) => { const e = $(id); e.textContent = m; const f = e.closest("form"); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); };
const authMsg = e => ({
  "auth/email-already-in-use": "الاسم ده متسجل قبل كدا. دوس Sign in وادخل بالباسورد الخاص بيك.",
  "auth/invalid-credential": "الاسم أو الباسورد غلط. استخدم الباسورد اللي اخترته وقت التسجيل.", "auth/wrong-password": "الباسورد غلط.", "auth/invalid-login-credentials": "الاسم أو الباسورد غلط.",
  "auth/user-not-found": "الاسم ده لسه ماسجلش. دوس Register.",
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
$("forgot").onclick = () => modal(`<h3>نسيت الباسورد؟</h3><p class="ar" style="opacity:.85;margin-top:8px">الباسورد الخاص بيك هو اللي <b>اخترته وقت التسجيل</b>، وده غير <b>كود الدفعة</b> (كود الدفعة بيتكتب مرة واحدة بس عند التسجيل).</p>
  <p class="ar" style="opacity:.85;margin-top:10px">لو نسيته بجد: كلّم صاحبة الموقع علشان تمسح حسابك من Firebase، وبعدها تسجّل من جديد بنفس اسمك.</p>`, "small");

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
  const pw = $("regPass").value.trim();
  if (pw.length < 6) return authErr("regErr", "الباسورد لازم 6 حروف على الأقل.");
  if (pw === PASSWORD) return authErr("regErr", "ده كود الدفعة! اختار باسورد تاني خاص بيك.");
  if (pw !== $("regPass2").value.trim()) return authErr("regErr", "الباسوردين مش متطابقين.");
  const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true; $("regErr").textContent = "";
  try {
    registering = true;
    await setPersistence(auth, $("regRemember").checked ? browserLocalPersistence : browserSessionPersistence);
    const cred = await createUserWithEmailAndPassword(auth, emailOf(p.key), pw);
    const data = { uid: cred.user.uid, name: p.name, key: p.key, nickname: p.nickname, bio: "", photo: regPhoto || "", createdAt: serverTimestamp() };
    await setDoc(doc(db, "users", cred.user.uid), data);
    registering = false;
    await startApp({ ...data, createdAt: Date.now() }, true);
  } catch (err) { registering = false; console.error(err); authErr("regErr", err.code === "permission-denied" ? "قواعد Firestore مش منشورة. راجع الدليل." : authMsg(err)); }
  btn.disabled = false;
};
$("loginForm").onsubmit = async e => {
  e.preventDefault();
  if (!CONFIGURED) return authErr("logErr", "Firebase مش متوصل لسه.");
  const p = findPerson($("logName").value);
  if (!p) return authErr("logErr", "الاسم ده مش من دفعة Pharmily 16. اختاره من القايمة.");
  const pw = $("logPass").value.trim();
  const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true; $("logErr").textContent = "";
  try {
    await setPersistence(auth, $("logRemember").checked ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, emailOf(p.key), pw);   // onAuthStateChanged هيكمل
  } catch (err) {
    console.error(err);
    if (pw === PASSWORD && /credential|password/.test(err.code || "")) authErr("logErr", "ده كود الدفعة مش باسوردك! اكتب الباسورد الخاص بيك اللي اخترته وقت التسجيل.");
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
const onReady = fn => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn();

if (CONFIGURED) {
  onReady(() => onAuthStateChanged(auth, async u => {
    if (registering) return;
    if (!u) { stopApp(); showAuth(); return; }
    if (started && me?.uid === u.uid) return;
    try { await startApp(await ensureProfile(u)); }
    catch (err) { console.error(err); showAuth(); authErr("logErr", err.code === "permission-denied" ? "قواعد Firestore مش منشورة. راجع الدليل." : authMsg(err)); }
  }));
} else { $("cfgWarn").hidden = false; showAuth(); }

async function startApp(profile, justRegistered) {
  if (started) stopApp();
  started = true; me = { ...profile };
  $("auth").hidden = true; $("app").hidden = false; $("partyBtn").hidden = false; $("tabbar").hidden = false; $("splash").classList.add("off");
  initStatic(); renderAll();
  unsubs.push(onSnapshot(collection(db, "users"), snap => {
    users.clear(); usersByKey.clear(); usersLoaded = true;
    snap.forEach(d => { const u = { uid: d.id, ...d.data() }; users.set(d.id, u); usersByKey.set(u.key, u); });
    if (users.get(me.uid)) me = { ...users.get(me.uid) };
    renderAll();
  }, fail));
  PH.posts.start();
  unsubs.push(onSnapshot(query(collection(db, "chats"), where("members", "array-contains", me.uid)), onChats, fail));
  unsubs.push(onSnapshot(collection(db, "users", me.uid, "future"), snap => renderFuture(snap.docs.map(d => ({ id: d.id, ...d.data() }))), fail));
  if (justRegistered) toast("أهلاً بيك في Pharmily! بروفايلك جاهز.");
}
function stopApp() {
  unsubs.forEach(f => f()); unsubs = []; threadUnsub?.(); threadUnsub = null; PH.posts?.stop();
  users.clear(); usersByKey.clear(); chats = []; current = null; me = null; started = false; usersLoaded = false;
  state.hasMem = false; state.memReady = false; $("chat").hidden = true; closeModals();
}
function fail(err) { console.error(err); if (err.code === "permission-denied") toast("مفيش صلاحية: تأكد إن قواعد Firestore منشورة (الدليل، خطوة الـ Rules).", true); }

/* =========================================================
   الرسم
   ========================================================= */
let queued = false;
function renderAll() { if (queued) return; queued = true; raf(() => { queued = false; if (!me) return; renderNav(); renderStats(); renderPeople(); renderChatList(); renderThreadHead(); renderSteps(); PH.posts.render(); }); }

function renderNav() {
  put($("meAv"), av(me.name, me.photo, 34)); $("meName").textContent = first2(me.name).split(" ")[0];
  $("hello").innerHTML = `${ic("sparkles")}<span>Welcome, ${esc(first2(me.name).split(" ")[0])}</span>`;
}
function renderStats() { $("stJoined").dataset.to = users.size; if (!$("stJoined")._n) $("stJoined").textContent = users.size; }

function renderPeople() {
  const v = clean($("q").value);
  const all = PEOPLE.map(p => ({ p, u: usersByKey.get(p.key) })).filter(o => (!v || o.p.key.includes(v)) && (!filterJoined || o.u));
  const n = Math.max(1, Math.ceil(all.length / 30)); if (page > n) page = 1;
  put($("grid"), all.slice((page - 1) * 30, page * 30).map(o => {
    const nick = o.u?.nickname || o.p.nickname;
    return `<button class="st lift tilt ${o.u ? "" : "off"}" data-act="profile" data-v="${esc(o.p.key)}"><div class="av" style="position:relative">${o.u ? '<span class="dot" title="Joined"></span>' : ""}<span>${esc(initials(o.p.name))}</span>${cardImg(o.p)}</div><b>${esc(first2(o.p.name))}</b><i>${esc(nick)}</i></button>`;
  }).join(""));
  put($("pages"), n > 1 ? Array.from({ length: n }, (_, i) => `<button class="btn sm ${i + 1 === page ? "on" : ""}" data-p="${i + 1}">${i + 1}</button>`).join("") : "");
  $("fAll").classList.toggle("on", !filterJoined); $("fJoined").classList.toggle("on", filterJoined);
}
$("pages").onclick = e => { const p = e.target.dataset.p; if (p) { page = +p; renderPeople(); $("meet").scrollIntoView(); } };
$("q").oninput = () => { page = 1; renderPeople(); };
$("fAll").onclick = () => { filterJoined = false; page = 1; renderPeople(); };
$("fJoined").onclick = () => { filterJoined = true; page = 1; renderPeople(); };

/* ---------- خطوات البداية: بتتشال أول ما تتنفذ ---------- */
const STEPS = [
  { k: "photo", n: 1, i: "user", t: "كمّل بروفايلك", p: "حط صورتك ولقبك ونبذة عنك.", act: "edit", done: () => !!me.photo },
  { k: "mem", n: 2, i: "camera", t: "شارك ذكرى", p: "صورة + كابشن، واسمك بيظهر تحتها.", act: "share", done: () => state.hasMem },
  { k: "hi", n: 3, i: "message", t: "قول Hi لزميل", p: "ابعت رسالة من الشات لأي حد سجّل.", act: "chat", done: () => !!me.sentMsg }
];
function renderSteps() {
  const sec = $("steps");
  if (!usersLoaded || !state.memReady) { sec.hidden = true; return; }
  const pend = STEPS.filter(s => !s.done()), keys = pend.map(s => s.k).join(",");
  if (sec._k === keys) return;
  const old = (sec._k || "").split(",").filter(Boolean), gone = old.filter(k => !pend.find(s => s.k === k));
  sec._k = keys;
  gone.forEach(k => { sec.querySelector(`[data-k="${k}"]`)?.classList.add("out"); toast("✓ " + STEPS.find(s => s.k === k).t + " (خلصت)"); });
  const apply = () => {
    if (!pend.length) { if (gone.length) toast("كل الخطوات خلصت 🎉"); sec.hidden = true; return; }
    sec.hidden = false;
    put($("stepGrid"), pend.map((s, i) => `<button class="step lift tilt rv" data-act="${s.act}" data-k="${s.k}" style="--d:${.08 * i}s"><span class="n">${s.n}</span><span class="av">${ic(s.i)}</span><h3 class="ar">${s.t}</h3><p class="ar">${s.p}</p></button>`).join(""));
    PH.watch(sec);
  };
  gone.length ? setTimeout(apply, 480) : apply();
}

/* =========================================================
   البروفايل
   ========================================================= */
async function openProfile(key) {
  const p = PBYKEY.get(key); if (!p) return;
  const u = usersByKey.get(key), isMe = u && u.uid === me.uid;
  const nick = u?.nickname || p.nickname, bio = u?.bio || "";
  const m = modal(`<div class="pf-top">${av(p.name, u?.photo, 104)}<div style="flex:1;min-width:180px"><h3>${esc(title(p.name))}</h3>
      ${nick ? `<span class="chip" style="margin-top:6px">${esc(nick)}</span>` : ""}${bio ? `<p class="bio" dir="auto">${esc(bio)}</p>` : ""}
      <div class="hint" style="margin-top:8px">${u ? `${ic("users")} Joined ${fmtDate(u.createdAt)}` : "Not joined yet"}</div></div></div>
    <div class="pf-act">
      ${isMe ? `<button class="btn primary" data-act="edit">${ic("edit")}Edit profile</button><button class="btn" data-act="logout">${ic("logout")}Sign out</button>`
      : u ? `<button class="btn primary" data-act="chat" data-v="${u.uid}">${ic("message")}Message</button>`
        : `<span class="hint ar">لسه ماسجلش. أول ما يسجل تقدر تبعتله رسالة.</span>`}
    </div>
    ${u ? `<div class="pf-sec"><h4>Memories</h4><div class="mini" id="pfMem"><span class="hint">${ic("loader", "spin")}</span></div></div>` : ""}`, "wide");
  if (!u) return;
  try {
    const list = await PH.posts.byAuthor(u.uid), box = m.querySelector("#pfMem"); if (!box) return;
    box.innerHTML = list.length ? list.map(x => `<button data-act="post" data-v="${x.id}"><img src="${esc(x.thumb)}" alt=""></button>`).join("") : `<span class="hint ar">مفيش ذكريات لسه.</span>`;
  } catch (e) { console.error(e); }
}
function openEdit() {
  let photo = me.photo || "";
  const m = modal(`<h3>Edit profile</h3><form id="edForm">
    <div class="pick"><button type="button" class="av ${photo ? "has" : ""}" id="edBtn" style="--sz:84px"><span id="edIni">${photo ? `<img src="${esc(photo)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : esc(initials(me.name))}</span><span class="cam">${ic("camera")}</span></button>
      <div><b style="color:var(--g2)">${esc(title(me.name))}</b><div class="hint ar">الاسم ثابت زي الشيت. الصورة دي بتظهر فوق في الشريط.</div><button type="button" class="btn sm" id="edRm" style="margin-top:6px">Remove photo</button></div><input id="edFile" type="file" accept="image/*" hidden></div>
    <div class="field"><label for="edNick">Nickname · اللقب</label><input id="edNick" maxlength="30" dir="auto" value="${esc(me.nickname || "")}"></div>
    <div class="field"><div class="lbl"><label for="edBio">Bio · نبذة</label><span id="edCnt"></span></div><textarea id="edBio" rows="3" maxlength="160" dir="auto">${esc(me.bio || "")}</textarea></div>
    <div class="err ar" id="edErr"></div><button class="btn primary full" type="submit">${ic("check")}Save</button></form>`);
  const bio = m.querySelector("#edBio"), cnt = () => m.querySelector("#edCnt").textContent = bio.value.length + "/160"; cnt(); bio.oninput = cnt;
  m.querySelector("#edBtn").onclick = () => m.querySelector("#edFile").click();
  m.querySelector("#edFile").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { photo = await resizeSquare(f, 160, .8); m.querySelector("#edBtn").classList.add("has"); m.querySelector("#edIni").innerHTML = `<img src="${photo}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`; }
    catch { m.querySelector("#edErr").textContent = "الصورة دي مش مدعومة."; }
  };
  m.querySelector("#edRm").onclick = () => { photo = ""; m.querySelector("#edBtn").classList.remove("has"); m.querySelector("#edIni").textContent = initials(me.name); };
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
  pop.innerHTML = r.length ? r.map(p => { const u = usersByKey.get(p.key); return `<button class="row" data-act="profile" data-v="${esc(p.key)}">${av(p.name, u?.photo, 30)}<span style="text-transform:capitalize">${esc(first2(p.name))}</span><small>${u ? "joined" : "—"}</small></button>`; }).join("") : `<div class="row hint">No results</div>`;
  pop.hidden = false;
};
$("sBtn").onclick = () => { const n = $("nav"); n.classList.toggle("searching"); if (n.classList.contains("searching")) setTimeout(() => $("gs").focus(), 50); else { $("gs").value = ""; $("gsPop").hidden = true; } };

/* =========================================================
   الشات
   ========================================================= */
const cid = (a, b) => [a, b].sort().join("_");
function onChats(snap) {
  const first = !onChats.ready; onChats.ready = true;
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
  $$(".msgBadge").forEach(b => { b.hidden = !tot; b.textContent = tot > 9 ? "9+" : tot; });
  markRead();
}
function renderChatList() {
  const list = $("cList"); if (!list || list._pick) return;
  put(list, chats.length ? chats.map(c => {
    const oid = c.members.find(x => x !== me.uid), o = users.get(oid), n = c.unread?.[me.uid] || 0;
    return `<button class="crow ${current === oid ? "on" : ""}" data-act="chat" data-v="${oid}">${av(o?.name || "?", o?.photo, 44)}<span class="tx"><b>${esc(first2(o?.name || "?"))}</b><small>${c.lastFrom === me.uid ? "You: " : ""}${esc(c.lastMsg || "")}</small></span>${n ? `<span class="n">${n}</span>` : ""}</button>`;
  }).join("") : `<div class="cnone"><span>${ic("message")}</span><span class="ar">مفيش رسايل لسه.<br>دوس + وابدأ محادثة.</span></div>`);
}
function openChat(uid) {
  const c = $("chat");
  if (c.hidden) { c.hidden = false; document.body.classList.add("lock"); raf(() => c.classList.add("in")); }
  closeModals(); $("list-reset");
  $("cList")._pick = false;
  if (uid && uid !== me.uid) { current = uid; $("cbox").classList.add("thread"); threadFor = null; attachThread(); renderThread(); markRead(); }
  else { current = null; $("cbox").classList.remove("thread"); renderThread(); }
  $("cList")._h = ""; renderChatList();
}
function closeChat() { const c = $("chat"); c.classList.remove("in"); document.body.classList.remove("lock"); setTimeout(() => c.hidden = true, 300); }
$("cClose").onclick = closeChat;
$("chat").addEventListener("mousedown", e => { if (e.target === $("chat")) closeChat(); });

function attachThread() {
  if (!current) { threadUnsub?.(); threadUnsub = null; threadFor = null; return; }
  const id = cid(me.uid, current);
  if (threadFor === id) return;
  if (!chats.find(c => c.id === id)) { threadUnsub?.(); threadUnsub = null; threadMsgs = []; threadFor = null; return; }
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
      <form class="comp" id="comp"><textarea id="ctx" rows="1" dir="auto" maxlength="1000" placeholder="Write a message…"></textarea><button class="circle send" aria-label="Send">${ic("send")}</button></form>`;
    $("cBack").onclick = () => { current = null; $("cbox").classList.remove("thread"); box._cur = null; renderChatList(); };
    $("comp").onsubmit = sendMsg;
    $("ctx").onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !matchMedia("(pointer:coarse)").matches) { e.preventDefault(); sendMsg(e); } };
    $("ctx").oninput = e => { e.target.style.height = "auto"; e.target.style.height = Math.min(120, e.target.scrollHeight) + "px"; };
    stick = true; if (!matchMedia("(pointer:coarse)").matches) $("ctx").focus();
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
    if (!me.sentMsg) updateDoc(doc(db, "users", me.uid), { sentMsg: true }).catch(() => { });
  } catch (err) { console.error(err); t.value = text; toast("الرسالة ماتبعتتش.", true); }
  sending = false;
}
function markRead() {
  if (!current || $("chat").hidden) return;
  const c = chats.find(x => x.id === cid(me.uid, current));
  if (c && (c.unread?.[me.uid] || 0) > 0) setDoc(doc(db, "chats", c.id), { unread: { [me.uid]: 0 } }, { merge: true }).catch(() => { });
}
$("cNew").onclick = () => {
  const box = $("cList"); box._h = ""; box._pick = true;
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
  put($("fl"), list.map(m => Date.now() >= m.unlock ? `<div class="fut">${ic("sparkles")}<span dir="auto">${esc(m.text)}</span></div>` : `<div class="fut">${ic("lock")}<span class="ar">مقفولة · فاضل ${Math.ceil((m.unlock - Date.now()) / 864e5)} يوم</span></div>`).join(""));
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
  if (!e.target.closest(".search,#sBtn")) { $("gsPop").hidden = true; }
  if (!e.target.closest("#meBtn,#menu")) $("menu").hidden = true;
  if (e.target.closest(".links a")) $("nav").classList.remove("open");
  if (!t) return;
  const v = t.dataset.v; $("menu").hidden = true; $("gsPop").hidden = true;
  switch (t.dataset.act) {
    case "profile": closeModals(); closeChatIfOpen(); openProfile(v); break;
    case "profile-me": openProfile(me.key); break;
    case "edit": closeModals(); openEdit(); break;
    case "chat": openChat(v); break;
    case "logout": closeModals(); closeChat(); signOut(auth); break;
  }
});
function closeChatIfOpen() { if (!$("chat").hidden) closeChat(); }
$("meBtn").onclick = () => $("menu").hidden = !$("menu").hidden;
$("burger").onclick = () => $("nav").classList.toggle("open");

/* ---------- ثابت: أول مرة بس ---------- */
let inited = false, io;
function initStatic() {
  if (inited) return; inited = true;
  $("lt").textContent = LETTER; $("fy").textContent = FUTURE_YEARS;
  $("mq").textContent = ("FIRST LECTURES · WHITE COATS · LATE-NIGHT LABS · EXAM SEASONS · LIFELONG FRIENDS · ONE FAMILY · ").repeat(6);
  if (typeof HERO_PHOTO === "string" && HERO_PHOTO) {
    const i = new Image(); i.onload = () => { $("heroArt").insertAdjacentHTML("beforeend", `<div class="photo" style="background-image:url('${HERO_PHOTO}')"></div>`); }; i.src = HERO_PHOTO;
  }
  io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .1 });
  PH.watch(document);
  const links = ["home", "memories", "meet", "journey", "future"];
  const spy = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) $$(".links a,.tabbar a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + x.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
  links.forEach(id => spy.observe($(id)));
}

/* ---------- واجهة مشتركة مع posts.js و fx.js ---------- */
const PH = window.PH = Object.assign(window.PH || {}, {
  FB, db, $, $$, esc, clean, title, first2, initials, ic, ms, fmtDate, fmtTime, ago, put, raf, toast, modal, confirmBox, closeModals, av,
  resizeFit, resizeSquare, users, usersByKey, state, fail, renderAll,
  get me() { return me; },
  watch(root) { if (io) $$(".rv:not(.in)", root).forEach(x => io.observe(x)); }
});
})();
