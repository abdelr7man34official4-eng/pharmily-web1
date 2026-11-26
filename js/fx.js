/* =========================================================
   fx.js — حركات وتأثيرات الماوس (للكمبيوتر بس). الموبايل بياخد النسخة الهادية.
   ========================================================= */
(() => {
  const $ = id => document.getElementById(id);
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* حروف الـ wordmark: كل حرف لوحده علشان يتحرك */
  document.querySelectorAll(".wm-word").forEach(el => {
    const t = el.textContent; el.setAttribute("aria-label", t);
    el.innerHTML = [...t].map((c, i) => `<span class="ch" style="--i:${i}" aria-hidden="true">${c}</span>`).join("");
  });

  /* شريط تقدم السكرول + باراليكس الهيرو */
  const prog = $("prog"), hero = document.querySelector(".hero");
  let tick = false;
  addEventListener("scroll", () => {
    if (tick) return; tick = true;
    requestAnimationFrame(() => {
      tick = false;
      const h = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
      if (hero && !reduce) hero.style.setProperty("--sy", Math.min(scrollY, 800));
    });
  }, { passive: true });

  /* الموبايل: العناصر بتظهر بحركة ناعمة وهي داخلة الشاشة (مرة واحدة لكل عنصر) */
  if (matchMedia("(max-width:760px)").matches && !reduce && "IntersectionObserver" in window) {
    const seen = new Set(), sel = ".mem,.st,.yr,.mc,.pk .lead,.feat,.stat,.step,.fm,.panel,.head";
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .06, rootMargin: "0px 0px -5% 0px" });
    const keyOf = el => el.dataset.v || el.dataset.yr || el.querySelector(".pic")?.dataset.v || el.id || (el.className + el.textContent.slice(0, 24));
    let batch = 0;
    const prep = el => {
      if (el.classList.contains("rev") || el.classList.contains("rv")) return;
      const k = keyOf(el); if (seen.has(k)) return; seen.add(k);
      el.classList.add("rev"); el.style.setProperty("--rd", (Math.min(batch++, 8) * 0.06).toFixed(2) + "s"); io.observe(el);
    };
    const scan = root => { batch = 0; (root.matches?.(sel) ? [root] : []).concat([...root.querySelectorAll?.(sel) || []]).forEach(prep); };
    const mo = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && scan(n))));
    ["mgrid", "grid", "pk", "rail", "stepsBox"].forEach(id => { const c = $(id); if (c) mo.observe(c, { childList: true }); });
    document.querySelectorAll("#app main").forEach(scan);
    addEventListener("pointerdown", e => { const b = e.target.closest(".btn,.act,.crow"); if (b) navigator.vibrate?.(6); }, { passive: true });
  }

  if (!fine || reduce) return;

  const glow = $("glow"), ring = $("ring");
  let mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my, rx = mx, ry = my, moved = false, raf = 0;
  const letters = () => [...document.querySelectorAll(".wordmark .ch,.wm-auth .ch")];
  function loop() {
    gx += (mx - gx) * .08; gy += (my - gy) * .08; rx += (mx - rx) * .22; ry += (my - ry) * .22;
    glow.style.transform = `translate(${gx}px,${gy}px)`; ring.style.transform = `translate(${rx}px,${ry}px)`;
    if (Math.abs(mx - gx) + Math.abs(my - gy) > .5) raf = requestAnimationFrame(loop); else raf = 0;
  }
  function near() {
    // الحروف القريبة من الماوس بتطلع وتنور
    for (const l of letters()) {
      const r = l.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2)), k = Math.max(0, 1 - d / 240);
      l.style.setProperty("--k", k.toFixed(3));
    }
    if (hero) {
      const r = hero.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) { hero.style.setProperty("--mx", ((mx - r.left) / r.width * 2 - 1).toFixed(3)); hero.style.setProperty("--my", ((my - r.top) / r.height * 2 - 1).toFixed(3)); }
    }
  }
  addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    mx = e.clientX; my = e.clientY;
    if (!moved) { moved = true; gx = rx = mx; gy = ry = my; document.body.classList.add("mv"); }
    if (!raf) raf = requestAnimationFrame(loop);
    near();
    ring.classList.toggle("big", !!e.target.closest("a,button,.tilt,input,textarea,label"));

    // ميل الكروت 3D
    const t = e.target.closest(".tilt");
    if (t) {
      const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty("--rx", ((.5 - y) * 9).toFixed(2) + "deg"); t.style.setProperty("--ry", ((x - .5) * 11).toFixed(2) + "deg");
      t.style.setProperty("--gx", (x * 100).toFixed(1) + "%"); t.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    }
    // أزرار مغناطيسية
    const b = e.target.closest(".btn.primary");
    if (b) { const r = b.getBoundingClientRect(); b.style.translate = `${((e.clientX - r.left - r.width / 2) * .14).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .22).toFixed(1)}px`; }
  }, { passive: true });
  document.addEventListener("pointerout", e => {
    if (e.pointerType !== "mouse") return;
    const t = e.target.closest?.(".tilt"); if (t && !t.contains(e.relatedTarget)) { t.style.removeProperty("--rx"); t.style.removeProperty("--ry"); }
    const b = e.target.closest?.(".btn.primary"); if (b && !b.contains(e.relatedTarget)) b.style.translate = "";
  });
  document.documentElement.addEventListener("mouseleave", () => document.body.classList.remove("mv"));
  document.documentElement.addEventListener("mouseenter", () => moved && document.body.classList.add("mv"));
})();
