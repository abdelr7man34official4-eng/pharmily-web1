/* =========================================================
   confetti.js — زرار الاحتفال (تحت على الشمال)
   دوسة: شرايط ورق ملون تنزل من فوق الشاشة | دوسة تانية: تختفي
   ========================================================= */
(function () {
  const btn = document.getElementById("partyBtn"), cv = document.getElementById("confetti");
  if (!btn || !cv) return;
  const ctx = cv.getContext("2d");
  const GOLD = ["#f4dfa8", "#d4af6a", "#ffffff", "#8a6d2f", "#ffd978", "#e8c27a", "#fff2cc"], ROSE = ["#72202e", "#1f2130", "#b0505f", "#d98a96", "#e8c27a", "#3a3d58", "#a8374a"];
  const palette = () => document.documentElement.dataset.theme === "light" ? ROSE : GOLD;
  let W = 0, H = 0, dpr = 1, parts = [], on = false, raf = 0, last = 0, fade = 1, spawnAcc = 0;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize); resize();

  const rnd = (a, b) => a + Math.random() * (b - a);
  function make(burstY) {
    const kind = Math.random();
    return {
      x: rnd(0, W), y: burstY !== undefined ? burstY : rnd(-40, -10),
      vx: rnd(-.6, .6), vy: rnd(1.6, 4.2), g: rnd(.01, .035),
      w: kind < .25 ? rnd(3, 5) : rnd(6, 12), h: kind < .25 ? rnd(18, 34) : rnd(8, 16),   // الأول شرايط طويلة (streamers)
      r: rnd(0, 6.28), vr: rnd(-.12, .12), flip: rnd(0, 6.28), vf: rnd(.04, .14),
      sway: rnd(.4, 1.6), ph: rnd(0, 6.28), c: palette()[(Math.random() * palette().length) | 0],
      round: kind > .8
    };
  }
  function burst() { for (let i = 0; i < Math.min(160, W / 7); i++) parts.push(make(rnd(-H * .6, -10))); }

  function frame(t) {
    const dt = Math.min(2.2, (t - last) / 16.67 || 1); last = t;
    ctx.clearRect(0, 0, W, H);
    if (on) { spawnAcc += dt * (W / 900); while (spawnAcc > 1) { parts.push(make()); spawnAcc--; } fade = 1; }
    else fade = Math.max(0, fade - .035 * dt);              // لما تقفلي: بتختفي بسرعة
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy = Math.min(p.vy + p.g * dt, 6.5); p.ph += .05 * dt;
      p.x += (p.vx + Math.sin(p.ph) * p.sway) * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.flip += p.vf * dt;
      if (p.y > H + 40) { if (on) { parts[i] = make(); } else parts.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = fade; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.flip)); ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 1.6, 0, 6.283); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (on || (parts.length && fade > 0)) raf = requestAnimationFrame(frame);
    else { parts = []; ctx.clearRect(0, 0, W, H); raf = 0; }
  }

  function set(v) {
    on = v; btn.classList.toggle("on", v); btn.setAttribute("aria-pressed", v);
    btn.title = v ? "Stop celebration · وقف الاحتفال" : "Celebrate · احتفال";
    if (v) { fade = 1; burst(); last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }
  }
  btn.addEventListener("click", () => set(!on));
})();
