/* =========================================================
   fx.js — حركات مع الماوس وحركات الموقع (كلها اختيارية وبتتقفل لو الجهاز لمس أو reduced-motion)
   ========================================================= */
(() => {
const PH = window.PH || (window.PH = {});
const $ = id => document.getElementById(id), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

/* ---------- عدّاد متحرك ---------- */
PH.countTo = (el, to) => {
  if (!el) return; to = +to || 0; const from = +el._v || 0; el._v = to;
  if (reduce || from === to) { el.textContent = to; return; }
  const t0 = performance.now(), d = 800;
  cancelAnimationFrame(el._r);
  const step = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) el._r = requestAnimationFrame(step); };
  el._r = requestAnimationFrame(step);
};

/* ---------- الـ wordmark: كل حرف لوحده + أنيميشن دخول ---------- */
function splitWordmarks() {
  $$("[data-wm]").forEach(h => {
    if (h._split) return; h._split = true;
    const sup = h.querySelector("sup"), txt = [...h.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join("").trim();
    h.querySelectorAll(":scope > :not(sup)").forEach(n => n.remove()); [...h.childNodes].forEach(n => n.nodeType === 3 && n.remove());
    const w = document.createElement("span"); w.className = "wm-word"; w.setAttribute("aria-hidden", "true");
    [...txt].forEach((c, i) => { const s = document.createElement("span"); s.className = "wm-l"; s.textContent = c; s.style.setProperty("--i", i); w.append(s); });
    h.prepend(w);
    if (sup) { sup.classList.add("wm-sup"); sup.style.setProperty("--i", txt.length); }
    h.classList.add("go");
  });
}
splitWordmarks();

/* ---------- شريط تقدم السكرول ---------- */
const bar = $("progress");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const h = document.documentElement, m = h.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${m > 0 ? h.scrollTop / m : 0})`;
    ticking = false;
  });
}, { passive: true });

if (reduce || !fine) return;

/* ---------- نور يتبع الماوس ---------- */
const glow = $("glow"); let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; document.body.classList.add("mx"); }, { passive: true });
document.addEventListener("mouseleave", () => document.body.classList.remove("mx"));

/* ---------- Parallax للـ hero ---------- */
const hero = document.querySelector(".hero");
let px = 0, py = 0, ptx = 0, pty = 0;
hero && hero.addEventListener("pointermove", e => { const r = hero.getBoundingClientRect(); ptx = (e.clientX - r.left) / r.width - .5; pty = (e.clientY - r.top) / r.height - .5; }, { passive: true });
hero && hero.addEventListener("pointerleave", () => { ptx = pty = 0; });

/* ---------- Sparkle trail داخل الـ hero ---------- */
let lastSp = 0;
hero && hero.addEventListener("pointermove", e => {
  const now = performance.now(); if (now - lastSp < 70) return; lastSp = now;
  const r = hero.getBoundingClientRect(), s = document.createElement("span"); s.className = "trail";
  s.style.left = e.clientX - r.left + "px"; s.style.top = e.clientY - r.top + "px"; s.style.setProperty("--s", 8 + Math.random() * 12 + "px"); s.style.setProperty("--dx", (Math.random() - .5) * 30 + "px");
  hero.append(s); setTimeout(() => s.remove(), 900);
}, { passive: true });

/* ---------- Tilt 3D للكروت ---------- */
let tilted = null;
document.addEventListener("pointermove", e => {
  const t = e.target.closest?.(".tilt");
  if (tilted && tilted !== t) { tilted.style.removeProperty("--rx"); tilted.style.removeProperty("--ry"); tilted.classList.remove("tilting"); }
  tilted = t || null; if (!t) return;
  const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  t.classList.add("tilting"); t.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg"); t.style.setProperty("--ry", (x * 9).toFixed(2) + "deg");
  t.style.setProperty("--sx", (x + .5) * 100 + "%"); t.style.setProperty("--sy", (y + .5) * 100 + "%");
}, { passive: true });

/* ---------- أزرار مغناطيسية ---------- */
let mag = null;
document.addEventListener("pointermove", e => {
  const b = e.target.closest?.(".btn.primary,.circle,.tb-plus");
  if (mag && mag !== b) { mag.style.translate = ""; mag = null; }
  if (!b || b.disabled) return; mag = b;
  const r = b.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
  b.style.translate = `${(x * .18).toFixed(1)}px ${(y * .22).toFixed(1)}px`;
}, { passive: true });

/* ---------- حلقة الـ rAF الواحدة ---------- */
(function loop() {
  gx += (tx - gx) * .14; gy += (ty - gy) * .14;
  if (glow) glow.style.transform = `translate(${gx - 160}px,${gy - 160}px)`;
  px += (ptx - px) * .07; py += (pty - py) * .07;
  if (hero) { hero.style.setProperty("--mx", px.toFixed(3)); hero.style.setProperty("--my", py.toFixed(3)); }
  requestAnimationFrame(loop);
})();
})();
