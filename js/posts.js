/* =========================================================
   posts.js — الميموريز (كابشن قابل للتعديل + رياكتات فيسبوك + كومنتات) + Journey قابلة للإضافة
   ========================================================= */
(() => {
const PH = window.PH;
const { $, $$, esc, clean, first2, ic, ms, fmtDate, ago, put, raf, toast, confirmBox, av, resizeFit, users, state, fail } = PH;
const modal = (...a) => PH.modal(...a);
const { doc, collection, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, increment } = PH.FB;
const db = PH.db, me = () => PH.me;

/* ---------- أنواع الرياكشن (زي فيسبوك) ---------- */
const RX = [
  { t: "like", e: "👍", n: "Like", c: "#4da3ff" }, { t: "love", e: "❤️", n: "Love", c: "#ff5d73" },
  { t: "care", e: "🥰", n: "Care", c: "#ffc933" }, { t: "haha", e: "😂", n: "Haha", c: "#ffc933" },
  { t: "wow", e: "😮", n: "Wow", c: "#ffc933" }, { t: "sad", e: "😢", n: "Sad", c: "#ffc933" }, { t: "angry", e: "😡", n: "Angry", c: "#ff7a3d" }
];
const RXM = Object.fromEntries(RX.map(r => [r.t, r]));

/* ---------- الحالة ---------- */
let memories = [], memLimit = 24, loaded = false, jItems = [], yearView = null;
const memCache = new Map();
let memUnsub = null, mineUnsub = null, jUnsub = null;

function start() {
  stop();
  const box = $("mgrid"); box._sk = true;
  box.innerHTML = Array.from({ length: 3 }, () => `<div class="mem sk"><div class="skl w60"></div><div class="skl pic"></div><div class="skl w40"></div></div>`).join("");
  memUnsub = onSnapshot(query(collection(db, "memories"), orderBy("createdAt", "desc"), limit(memLimit)), snap => {
    memories = snap.docs.map(d => ({ id: d.id, ...d.data() })); memories.forEach(m => memCache.set(m.id, m)); loaded = true; PH.renderAll();
  }, fail);
  mineUnsub = onSnapshot(query(collection(db, "memories"), where("authorId", "==", me().uid), limit(1)), s => { state.hasMem = s.size > 0; state.memReady = true; PH.renderAll(); }, e => { state.memReady = true; fail(e); PH.renderAll(); });
  jUnsub = onSnapshot(query(collection(db, "journey"), orderBy("createdAt", "desc"), limit(80)), s => { jItems = s.docs.map(d => ({ id: d.id, ...d.data() })); jItems.forEach(x => memCache.set("j:" + x.id, x)); PH.renderAll(); }, fail);
}
function stop() {
  [memUnsub, mineUnsub, jUnsub].forEach(f => f && f()); memUnsub = mineUnsub = jUnsub = null; memories = []; jItems = []; loaded = false; memLimit = 24; yearView = null;
}
async function byAuthor(uid) {
  const s = await getDocs(query(collection(db, "memories"), where("authorId", "==", uid)));
  const list = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  list.forEach(x => memCache.set(x.id, x)); return list;
}
$("memMore").onclick = () => { memLimit += 24; memUnsub && memUnsub(); memUnsub = onSnapshot(query(collection(db, "memories"), orderBy("createdAt", "desc"), limit(memLimit)), snap => { memories = snap.docs.map(d => ({ id: d.id, ...d.data() })); memories.forEach(m => memCache.set(m.id, m)); PH.renderAll(); }, fail); };

/* ---------- حسابات الرياكشن ---------- */
function rxStat(m) {
  const rx = m.rx || {}, counts = {}; let total = 0;
  for (const u in rx) { const t = rx[u]; if (t && RXM[t]) { counts[t] = (counts[t] || 0) + 1; total++; } }
  const mine = RXM[rx[me().uid]] || null;
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
  return { counts, total, mine, top };
}
const summaryHTML = (m, asWho) => {
  const { total, top } = rxStat(m), cc = Math.max(0, m.cc || 0);
  if (!total && !cc) return `<div class="rxsum empty"></div>`;
  return `<div class="rxsum">${total ? `<button class="rxtop" ${asWho ? 'data-pv="who"' : `data-act="post" data-v="${m.id}"`}><span class="rxicons">${top.map((t, i) => `<span style="z-index:${3 - i}">${RXM[t].e}</span>`).join("")}</span><b>${total}</b></button>` : "<span></span>"}
    ${cc ? `<button class="cmcount" data-act="post" data-v="${m.id}" data-focus="1">${cc} ${cc === 1 ? "comment" : "comments"}</button>` : ""}</div>`;
};
const actionsHTML = m => {
  const { mine } = rxStat(m);
  return `<div class="acts"><div class="rxwrap">
      <button class="act rxbtn ${mine ? "on" : ""}" data-act="rx-main" data-v="${m.id}" ${mine ? `style="--c:${mine.c}"` : ""}>${mine ? `<span class="rxe">${mine.e}</span><span>${mine.n}</span>` : `${ic("thumb")}<span>Like</span>`}</button>
      <div class="rxpick" role="menu">${RX.map((r, i) => `<button class="rx-e" data-act="rx-set" data-v="${m.id}" data-t="${r.t}" style="--i:${i}" aria-label="${r.n}"><span>${r.e}</span><i>${r.n}</i></button>`).join("")}</div></div>
    <button class="act" data-act="post" data-v="${m.id}" data-focus="1">${ic("message")}<span>Comment</span></button></div>`;
};

/* ---------- كارت الميموري ---------- */
function card(m) {
  const u = users.get(m.authorId), own = m.authorId === me().uid;
  return `<div class="cap" dir="auto">${esc(m.caption)}${m.edited ? '<span class="edited"> · edited</span>' : ""}</div>
    <button class="pic" data-act="post" data-v="${m.id}" aria-label="Open photo"><img src="${esc(m.thumb)}" alt="" loading="lazy"></button>
    <div class="by">${av(m.authorName, u?.photo, 34)}
      <button class="who" data-act="profile" data-v="${esc(clean(m.authorName))}"><b>${esc(first2(m.authorName))}</b><small>${fmtDate(m.createdAt)}</small></button>
      ${own ? `<button class="circle sm" data-act="post-edit" data-v="${m.id}" aria-label="Edit caption" title="Edit caption">${ic("edit")}</button><button class="circle sm del" data-act="delmem" data-v="${m.id}" aria-label="Delete">${ic("trash")}</button>` : ""}
    </div>${summaryHTML(m)}${actionsHTML(m)}`;
}
function sync(box, items, html, cls) {
  const map = new Map($$(":scope > [data-id]", box).map(n => [n.dataset.id, n]));
  let prev = null; const seen = new Set();
  items.forEach((it, idx) => {
    let n = map.get(it.id); const h = html(it);
    if (!n) { n = document.createElement("article"); n.className = cls + " new"; n.dataset.id = it.id; n.style.animationDelay = Math.min(idx, 8) * 60 + "ms"; n.innerHTML = h; n._h = h; }
    else if (n._h !== h) { n.innerHTML = h; n._h = h; }
    const ref = prev ? prev.nextSibling : box.firstChild;
    if (n !== ref) box.insertBefore(n, ref);
    prev = n; seen.add(it.id);
  });
  map.forEach((n, id) => { if (!seen.has(id)) n.remove(); });
}
function renderFeed() {
  const box = $("mgrid"); if (!loaded) return;
  if (box._sk) { box._sk = false; box.innerHTML = ""; }
  if (!memories.length) {
    if (!box.querySelector(".empty-box")) box.innerHTML = `<div class="empty-box"><span style="color:var(--g)">${ic("image")}</span><b class="ar" style="color:var(--g2)">لسه مفيش ذكريات. خليك أول واحد!</b><button class="btn primary" data-act="share">${ic("camera")}Share a memory</button></div>`;
  } else { box.querySelector(".empty-box")?.remove(); sync(box, memories, card, "mem lift"); }
  $("memMore").hidden = memories.length < memLimit;
  window.PH.countTo ? PH.countTo($("stMem"), memories.length) : ($("stMem").textContent = memories.length);
}
function renderRail() {
  const list = memories.slice(0, 8);
  put($("rail"), list.length ? list.map(m => `<button class="mc lift tilt" data-act="post" data-v="${m.id}" style="background-image:url('${esc(m.thumb)}')"><span class="t" dir="auto">${esc(m.caption)}</span><span class="by">${av(m.authorName, users.get(m.authorId)?.photo, 24)}<span style="text-transform:capitalize">${esc(first2(m.authorName))}</span></span></button>`).join("")
    : Array.from({ length: 4 }, () => `<button class="mc empty lift" data-act="share">${ic("plus")}<b class="ar" style="color:var(--g2)">شارك أول ذكرى</b></button>`).join(""));
}
const rail = $("rail"), rtl = () => getComputedStyle(document.documentElement).direction === "rtl";
$("rr").onclick = () => rail.scrollBy({ left: rail.clientWidth * .8 * (rtl() ? -1 : 1), behavior: "smooth" });
$("rl").onclick = () => rail.scrollBy({ left: -rail.clientWidth * .8 * (rtl() ? -1 : 1), behavior: "smooth" });

/* =========================================================
   رياكتات (hover / ضغطة طويلة على الموبايل)
   ========================================================= */
let hoverT, hideT, pressT, suppress = false;
const openPicker = w => { $$(".rxwrap.open").forEach(x => x !== w && x.classList.remove("open")); w.classList.add("open"); };
document.addEventListener("pointerover", e => {
  if (e.pointerType === "touch") return; const w = e.target.closest?.(".rxwrap"); if (!w) return;
  clearTimeout(hideT); if (!w.classList.contains("open")) { clearTimeout(hoverT); hoverT = setTimeout(() => openPicker(w), 320); }
});
document.addEventListener("pointerout", e => {
  const w = e.target.closest?.(".rxwrap"); if (!w || w.contains(e.relatedTarget)) return;
  clearTimeout(hoverT); hideT = setTimeout(() => w.classList.remove("open"), 280);
});
document.addEventListener("pointerdown", e => {
  const w = e.target.closest?.(".rxwrap");
  if (!w) { $$(".rxwrap.open").forEach(x => x.classList.remove("open")); return; }
  if (e.target.closest(".rxbtn")) { clearTimeout(pressT); pressT = setTimeout(() => { suppress = true; openPicker(w); navigator.vibrate?.(12); }, 420); }
});
["pointerup", "pointercancel", "pointermove"].forEach(ev => document.addEventListener(ev, e => { if (ev === "pointermove" && Math.abs(e.movementX) + Math.abs(e.movementY) < 4) return; clearTimeout(pressT); }));
document.addEventListener("contextmenu", e => { if (e.target.closest?.(".rxbtn")) e.preventDefault(); });

async function react(id, t) {
  const m = memCache.get(id); if (!m) return;
  const uid = me().uid, cur = (m.rx || {})[uid] || "", next = cur === t ? "" : t;
  m.rx = { ...(m.rx || {}), [uid]: next }; renderFeed(); refreshPost(id); renderRail();
  if (next) bump(id, RXM[next]);
  try { await setDoc(doc(db, "memories", id), { rx: { [uid]: next } }, { merge: true }); }
  catch (e) { m.rx = { ...m.rx, [uid]: cur }; renderFeed(); refreshPost(id); fail(e); toast("معرفتش أسجل الرياكشن.", true); }
}
function bump(id, r) {
  raf(() => $$(`[data-act="rx-main"][data-v="${id}"]`).forEach(b => {
    b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
    const rc = b.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const s = document.createElement("span"); s.className = "fly"; s.textContent = r.e;
      s.style.cssText = `left:${rc.left + rc.width / 2}px;top:${rc.top}px;--dx:${(Math.random() - .5) * 90}px;--dy:${-50 - Math.random() * 70}px;--rot:${(Math.random() - .5) * 60}deg;animation-delay:${i * 50}ms`;
      document.body.append(s); setTimeout(() => s.remove(), 1200);
    }
  }));
}

/* =========================================================
   عرض البوست: كابشن (تعديل) + رياكتات + كومنتات
   ========================================================= */
const openPosts = new Map();   // id -> paint()
const refreshPost = id => openPosts.get(id)?.();

function openPost(id, o = {}) {
  let m = memCache.get(id); if (!m) return;
  let comments = [], editing = !!o.edit, whoOpen = false, docU = null, cmU = null, gotFull = false;
  const el = modal(`<div class="pv">
      <div class="pv-img"><img id="pvImg" src="${esc(m.thumb)}" alt=""><span class="pv-load" id="pvLoad">${ic("loader", "spin")}</span></div>
      <div class="pv-side">
        <div class="pv-head" id="pvHead"></div>
        <div class="pv-cap" id="pvCap"></div>
        <div id="pvSum"></div><div id="pvWho"></div>
        <div id="pvAct"></div>
        <div class="pv-cms" id="pvCms"></div>
        <form class="pv-comp" id="pvForm">${av(me().name, me().photo, 34)}<textarea id="pvTx" rows="1" maxlength="500" dir="auto" placeholder="Write a comment…"></textarea><button class="circle send" aria-label="Send">${ic("send")}</button></form>
      </div></div>`, "post", () => { docU && docU(); cmU && cmU(); openPosts.delete(id); });

  const q = s => el.querySelector(s);
  const paint = () => {
    const u = users.get(m.authorId), own = m.authorId === me().uid;
    put(q("#pvHead"), `${av(m.authorName, u?.photo, 42)}<div class="who"><button data-act="profile" data-v="${esc(clean(m.authorName))}"><b>${esc(first2(m.authorName))}</b></button><small>${fmtDate(m.createdAt)}${m.edited ? " · edited" : ""}</small></div>${own ? `<button class="circle sm" data-pv="edit" aria-label="Edit caption" title="Edit caption">${ic("edit")}</button><button class="circle sm del" data-act="delmem" data-v="${id}" aria-label="Delete">${ic("trash")}</button>` : ""}`);
    if (!editing) put(q("#pvCap"), `<p dir="auto">${esc(m.caption)}</p>`);
    put(q("#pvSum"), summaryHTML(m, true)); put(q("#pvAct"), actionsHTML(m));
    const rx = m.rx || {}, who = Object.keys(rx).filter(k => RXM[rx[k]]);
    put(q("#pvWho"), whoOpen && who.length ? `<div class="rxwho">${who.map(k => `<div>${RXM[rx[k]].e}<span>${esc(first2(users.get(k)?.name || "?"))}</span></div>`).join("")}</div>` : "");
    paintComments();
  };
  const paintComments = () => {
    const mineId = me().uid;
    put(q("#pvCms"), comments.length ? comments.map(c => {
      const cu = users.get(c.authorId), can = c.authorId === mineId || m.authorId === mineId;
      return `<div class="cm">${av(c.authorName, cu?.photo, 34)}<div class="cmb"><div class="bub2"><b>${esc(first2(c.authorName))}</b><span dir="auto">${esc(c.text)}</span></div><div class="cmeta"><span>${ago(c.createdAt)}</span>${can ? `<button data-pv="cdel" data-c="${c.id}">Delete</button>` : ""}</div></div></div>`;
    }).join("") : `<div class="hint ar" style="padding:14px 4px">مفيش تعليقات لسه. كون أول واحد 💬</div>`);
  };
  openPosts.set(id, () => { const c = memCache.get(id); if (c) { m = c; paint(); } });
  paint();
  if (editing) startEdit();

  docU = onSnapshot(doc(db, "memories", id), s => { if (!s.exists()) { el.close(); return; } m = { id, ...s.data() }; memCache.set(id, m); paint(); }, fail);
  cmU = onSnapshot(query(collection(db, "memories", id, "comments"), orderBy("createdAt", "asc"), limit(200)), s => {
    comments = s.docs.map(d => ({ id: d.id, ...d.data() })); const near = q("#pvCms").scrollHeight - q("#pvCms").scrollTop - q("#pvCms").clientHeight < 90; paintComments(); if (near) q("#pvCms").scrollTop = q("#pvCms").scrollHeight;
  }, fail);
  getDoc(doc(db, "memories", id, "blobs", "full")).then(s => { if (s.exists()) { q("#pvImg").src = s.data().data; } }).catch(() => { }).finally(() => q("#pvLoad")?.remove());

  function startEdit() {
    editing = true;
    q("#pvCap").innerHTML = `<textarea id="pvEd" rows="3" maxlength="140" dir="auto"></textarea><div class="pf-act" style="margin:10px 0 0"><button class="btn primary sm" data-pv="save">${ic("check")}Save</button><button class="btn sm" data-pv="cancel">Cancel</button></div>`;
    const t = q("#pvEd"); t.value = m.caption; t.focus(); t.setSelectionRange(t.value.length, t.value.length);
  }
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-pv]"); if (!b) return;
    switch (b.dataset.pv) {
      case "edit": startEdit(); break;
      case "cancel": editing = false; q("#pvCap")._h = ""; paint(); break;
      case "save": {
        const v = q("#pvEd").value.trim(); if (!v) return toast("الكابشن مينفعش يبقى فاضي.", true);
        if (v === m.caption) { editing = false; q("#pvCap")._h = ""; paint(); break; }
        b.disabled = true;
        try { await updateDoc(doc(db, "memories", id), { caption: v, edited: true }); editing = false; q("#pvCap")._h = ""; paint(); toast("اتعدّل الكابشن"); }
        catch (err) { fail(err); toast("معرفتش أعدّل.", true); b.disabled = false; }
        break;
      }
      case "who": whoOpen = !whoOpen; q("#pvWho")._h = ""; paint(); break;
      case "cdel":
        try { await deleteDoc(doc(db, "memories", id, "comments", b.dataset.c)); await setDoc(doc(db, "memories", id), { cc: increment(-1) }, { merge: true }); }
        catch (err) { fail(err); toast("معرفتش أمسح التعليق.", true); }
        break;
    }
  });
  const tx = q("#pvTx"), fit = () => { tx.style.height = "auto"; tx.style.height = Math.min(110, tx.scrollHeight) + "px"; };
  tx.oninput = fit;
  tx.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !matchMedia("(pointer:coarse)").matches) { e.preventDefault(); q("#pvForm").requestSubmit(); } };
  q("#pvForm").onsubmit = async e => {
    e.preventDefault(); const t = tx.value.trim(); if (!t) return; tx.value = ""; fit();
    try {
      await addDoc(collection(db, "memories", id, "comments"), { text: t, authorId: me().uid, authorName: me().name, createdAt: serverTimestamp() });
      await setDoc(doc(db, "memories", id), { cc: increment(1) }, { merge: true });
    } catch (err) { tx.value = t; fail(err); toast("التعليق ماتبعتش.", true); }
  };
  if (o.focus && !matchMedia("(pointer:coarse)").matches) setTimeout(() => tx.focus(), 350);
}

async function deleteMemory(id) {
  if (!await confirmBox("تمسح الذكرى دي؟")) return;
  try {
    const cs = await getDocs(collection(db, "memories", id, "comments")); await Promise.all(cs.docs.map(d => deleteDoc(doc(db, "memories", id, "comments", d.id))));
    await deleteDoc(doc(db, "memories", id, "blobs", "full")).catch(() => { }); await deleteDoc(doc(db, "memories", id));
    memCache.delete(id); PH.closeModals(); toast("اتمسحت.");
  } catch (e) { console.error(e); toast("معرفتش أمسحها.", true); }
}

/* ---------- لايت بوكس عام (للـ Journey) ---------- */
function closeLb() { $$(".lb").forEach(l => { l.classList.remove("in"); setTimeout(() => l.remove(), 300); }); }
async function lightbox({ thumb, caption, byName, byPhoto, full }) {
  const l = document.createElement("div"); l.className = "lb";
  l.innerHTML = `<button class="circle x" aria-label="Close">${ic("x")}</button><div class="lb-in">${caption ? `<div class="cap" dir="auto">${esc(caption)}</div>` : ""}<img src="${esc(thumb)}" alt="">${byName ? `<div class="by">${av(byName, byPhoto, 32)}<span>${esc(first2(byName))}</span></div>` : ""}</div><span class="load">${ic("loader", "spin")}</span>`;
  l.onclick = e => { if (!e.target.closest("img,.by,.cap") || e.target.closest(".x")) closeLb(); };
  document.body.append(l); raf(() => l.classList.add("in"));
  try { const f = await full(); if (f) l.querySelector("img").src = f; } catch (e) { console.error(e); }
  l.querySelector(".load")?.remove();
}

/* =========================================================
   رفع ميموري
   ========================================================= */
function openUpload() {
  let full = "", thumb = "";
  const m = modal(`<h3>Share a memory</h3><p class="ar" style="opacity:.75;font-size:.9rem">اختار صورة واكتب كابشن. الكابشن بيظهر فوق الصورة واسمك تحتها.</p>
    <form id="upForm">
      <label class="drop" id="upDrop">${ic("upload")}<b style="color:var(--g2)">Choose a photo</b><span class="hint ar">أو اسحبها هنا</span><input id="upFile" type="file" accept="image/*" hidden></label>
      <div class="prev" id="upPrev" hidden><img alt=""><button type="button" class="circle" id="upClr" aria-label="Remove">${ic("x")}</button></div>
      <div class="field"><div class="lbl"><label for="upCap">Caption · الكابشن</label><span id="upCount">0/140</span></div><textarea id="upCap" rows="2" maxlength="140" dir="auto" required placeholder="اكتب كابشن للصورة…"></textarea></div>
      <div class="postas">${av(me().name, me().photo, 36)}<span>Posting as <b>${esc(first2(me().name))}</b><br><small class="ar" style="opacity:.65">اسمك بيظهر تحت الصورة دايمًا</small></span>${ic("lock")}</div>
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
      const ref = await addDoc(collection(db, "memories"), { caption: m.querySelector("#upCap").value.trim(), thumb, rx: {}, cc: 0, authorId: me().uid, authorName: me().name, createdAt: serverTimestamp() });
      try { await setDoc(doc(db, "memories", ref.id, "blobs", "full"), { data: full }); }
      catch (err) { await deleteDoc(ref); throw err; }
      toast("اتشاركت الذكرى ✨"); m.close(); $("memories").scrollIntoView({ behavior: "smooth" });
    } catch (err) { console.error(err); m.querySelector("#upErr").textContent = "مقدرتش أرفع الصورة: " + (err.code || err.message); go.disabled = false; go.innerHTML = ic("send") + "<span>Share</span>"; }
  };
}

/* =========================================================
   Journey: كل سنة فيها صور وذكريات تتضاف
   ========================================================= */
function renderJourney() {
  const counts = JOURNEY.map((_, i) => jItems.filter(x => x.year === i).length);
  put($("pk"), `<div class="lead rv in"><div><div class="eyebrow">2022 — 2028</div><h2 style="margin-top:10px">Five years, <em>one story</em></h2><p class="ar">من أول يوم لحد التخرج. ادخل على أي سنة وضيف صور وذكريات وحاجات حصلت فيها.</p></div>${ic("route", "lg")}</div>` +
    JOURNEY.map((y, i) => {
      const cover = (y.photos && y.photos[0]) || (jItems.find(x => x.year === i && x.thumb) || {}).thumb || "";
      return `<button class="yr lift tilt rv in" data-act="year" data-v="${i}" style="${cover ? `background-image:url('${esc(cover)}')` : ""}"><span class="big">${i + 1}</span><span class="badge2">${ic(["cap", "flask", "pill", "users", "sparkles"][i % 5])}</span><small>${esc(y.year)} · ${esc(y.date)}</small><h3>${esc(y.title)}</h3><p class="ar">${esc(y.text)}</p><span class="chip cnt">${ic("image")}${counts[i]} moments</span></button>`;
    }).join(""));
  if (yearView) paintYear();
}
function openYear(i) {
  const y = JOURNEY[i];
  const el = modal(`<div class="eyebrow">${esc(y.year)} · ${esc(y.date)}</div><h3 style="margin-top:8px;font-size:1.9rem">${esc(y.title)}</h3><p class="ar" style="opacity:.85">${esc(y.text)}</p>
    ${(y.photos || []).length ? `<div class="ph">${y.photos.map(p => `<img src="${esc(p)}" alt="" loading="lazy">`).join("")}</div>` : ""}
    <div class="pf-act"><button class="btn primary" id="yrAdd">${ic("plus")}Add to this year</button></div>
    <form id="yrForm" hidden>
      <div class="field"><div class="lbl"><label for="yrTx">What happened? · إيه اللي حصل؟</label><span id="yrCnt">0/500</span></div><textarea id="yrTx" rows="3" maxlength="500" dir="auto" placeholder="اكتب ذكرى أو حاجة حصلت في السنة دي…"></textarea></div>
      <label class="drop sm" id="yrDrop">${ic("camera")}<b style="color:var(--g2)">Add a photo (optional)</b><input id="yrFile" type="file" accept="image/*" hidden></label>
      <div class="prev" id="yrPrev" hidden><img alt=""><button type="button" class="circle" id="yrClr" aria-label="Remove">${ic("x")}</button></div>
      <div class="err ar" id="yrErr"></div>
      <div class="pf-act" style="margin:0"><button class="btn primary" id="yrGo" type="submit" disabled>${ic("send")}<span>Post</span></button><button type="button" class="btn" id="yrCancel">Cancel</button></div>
    </form>
    <div class="pf-sec"><h4>Moments</h4><div id="yrList"></div></div>`, "wide", () => { yearView = null; });
  yearView = { i, el };
  const q = s => el.querySelector(s); let full = "", thumb = "";
  q("#yrAdd").onclick = () => { q("#yrForm").hidden = false; q("#yrAdd").parentElement.hidden = true; q("#yrTx").focus(); };
  q("#yrCancel").onclick = () => { q("#yrForm").hidden = true; q("#yrAdd").parentElement.hidden = false; };
  const check = () => q("#yrGo").disabled = !(q("#yrTx").value.trim() || full);
  q("#yrTx").oninput = e => { q("#yrCnt").textContent = e.target.value.length + "/500"; check(); };
  q("#yrFile").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { [full, thumb] = await Promise.all([resizeFit(f, 1400, .78), resizeFit(f, 480, .72)]); q("#yrPrev img").src = thumb; q("#yrPrev").hidden = false; q("#yrDrop").hidden = true; check(); }
    catch { q("#yrErr").textContent = "الصورة دي مش مدعومة."; }
  };
  q("#yrClr").onclick = () => { full = thumb = ""; q("#yrFile").value = ""; q("#yrPrev").hidden = true; q("#yrDrop").hidden = false; check(); };
  q("#yrForm").onsubmit = async e => {
    e.preventDefault(); const go = q("#yrGo"); go.disabled = true; go.innerHTML = ic("loader", "spin") + "<span>Posting…</span>";
    try {
      const ref = await addDoc(collection(db, "journey"), { year: i, text: q("#yrTx").value.trim(), thumb, authorId: me().uid, authorName: me().name, createdAt: serverTimestamp() });
      if (full) { try { await setDoc(doc(db, "journey", ref.id, "blobs", "full"), { data: full }); } catch (err) { await deleteDoc(ref); throw err; } }
      toast("اتضافت للسنة دي ✨"); q("#yrTx").value = ""; q("#yrCnt").textContent = "0/500"; q("#yrClr").click();
      q("#yrForm").hidden = true; q("#yrAdd").parentElement.hidden = false;
    } catch (err) { console.error(err); q("#yrErr").textContent = "معرفتش أضيف: " + (err.code || err.message); }
    go.innerHTML = ic("send") + "<span>Post</span>"; check();
  };
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-j]"); if (!b) return; const it = memCache.get("j:" + b.dataset.id); if (!it) return;
    if (b.dataset.j === "photo") lightbox({ thumb: it.thumb, caption: it.text, byName: it.authorName, byPhoto: users.get(it.authorId)?.photo, full: async () => { const s = await getDoc(doc(db, "journey", it.id, "blobs", "full")); return s.exists() ? s.data().data : null; } });
    if (b.dataset.j === "del" && await confirmBox("تمسح اللحظة دي؟")) { try { await deleteDoc(doc(db, "journey", it.id, "blobs", "full")).catch(() => { }); await deleteDoc(doc(db, "journey", it.id)); toast("اتمسحت."); } catch (err) { fail(err); toast("معرفتش أمسح.", true); } }
  });
  paintYear();
}
function paintYear() {
  if (!yearView) return; const box = yearView.el.querySelector("#yrList"); if (!box) return;
  const list = jItems.filter(x => x.year === yearView.i).sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  put(box, list.length ? list.map(it => {
    const u = users.get(it.authorId), own = it.authorId === me().uid;
    return `<div class="jit">${av(it.authorName, u?.photo, 38)}<div class="jb"><div class="jh"><b>${esc(first2(it.authorName))}</b><small>${fmtDate(it.createdAt)}</small>${own ? `<button class="circle sm del" data-j="del" data-id="${it.id}" aria-label="Delete">${ic("trash")}</button>` : ""}</div>
      ${it.text ? `<p dir="auto">${esc(it.text)}</p>` : ""}${it.thumb ? `<button class="jp" data-j="photo" data-id="${it.id}"><img src="${esc(it.thumb)}" alt="" loading="lazy"></button>` : ""}</div></div>`;
  }).join("") : `<div class="hint ar" style="padding:8px 2px">لسه محدش ضاف حاجة للسنة دي. كون أول واحد ✨</div>`);
}

/* ---------- أحداث ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act]"); if (!t) return;
  const v = t.dataset.v;
  switch (t.dataset.act) {
    case "share": openUpload(); break;
    case "post": openPost(v, { focus: t.dataset.focus }); break;
    case "post-edit": openPost(v, { edit: true }); break;
    case "delmem": deleteMemory(v); break;
    case "year": openYear(+v); break;
    case "rx-main": if (suppress) { suppress = false; break; } react(v, "like"); t.closest(".rxwrap")?.classList.remove("open"); break;
    case "rx-set": react(v, t.dataset.t); t.closest(".rxwrap")?.classList.remove("open"); break;
  }
});

PH.posts = { start, stop, render() { renderFeed(); renderRail(); renderJourney(); }, byAuthor, openPost, openUpload };
})();
