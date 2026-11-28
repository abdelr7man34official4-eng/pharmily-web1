/* زوم الصورة بس (مش الموقع كله): قرصة بصباعين، دبل تاب، عجلة الماوس، وسحب لما تكون مكبّرة */
(() => {
  const MAX = 5;
  function attach(img) {
    if (!img || img._zoom) return; img._zoom = 1;
    let s = 1, x = 0, y = 0, d0 = 0, s0 = 1, pan = null, lastTap = 0, moved = false;
    const pts = new Map();
    img.classList.add("zoomable"); img.draggable = false;
    const clamp = () => {
      if (s <= 1) { s = 1; x = y = 0; return; }
      const mx = img.offsetWidth * (s - 1) / 2, my = img.offsetHeight * (s - 1) / 2;
      x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y));
    };
    const apply = () => { clamp(); img.style.transform = s === 1 ? "" : `translate(${x}px,${y}px) scale(${s})`; img.classList.toggle("zoomed", s > 1.01); };
    const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    img.addEventListener("pointerdown", e => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { img.setPointerCapture(e.pointerId); } catch { }
      moved = false;
      if (pts.size === 2) { d0 = dist(); s0 = s; pan = null; }
      else { pan = { x: e.clientX - x, y: e.clientY - y }; }
    });
    img.addEventListener("pointermove", e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && d0) { s = Math.max(1, Math.min(MAX, s0 * dist() / d0)); moved = true; apply(); }
      else if (pts.size === 1 && s > 1 && pan) { x = e.clientX - pan.x; y = e.clientY - pan.y; moved = true; apply(); }
    });
    const up = e => {
      if (!pts.has(e.pointerId)) return; const wasOne = pts.size === 1; pts.delete(e.pointerId);
      if (pts.size === 1) { const [p] = [...pts.values()]; pan = { x: p.x - x, y: p.y - y }; d0 = 0; }
      if (!pts.size) {
        pan = null; d0 = 0;
        if (s < 1.05) { s = 1; apply(); }
        if (wasOne && !moved && e.type === "pointerup") {   // دبل تاب
          const n = Date.now(); if (n - lastTap < 300) { s = s > 1.05 ? 1 : 2.5; apply(); lastTap = 0; } else lastTap = n;
        }
      }
    };
    img.addEventListener("pointerup", up); img.addEventListener("pointercancel", up);
    img.addEventListener("wheel", e => { e.preventDefault(); s = Math.max(1, Math.min(MAX, s * (e.deltaY < 0 ? 1.18 : 1 / 1.18))); apply(); }, { passive: false });
    img.addEventListener("dblclick", e => { e.preventDefault(); });
  }
  window.attachZoom = attach;
  /* الموقع نفسه ثابت على الموبايل: مفيش قرصة ولا دبل تاب زوم للصفحة */
  ["gesturestart", "gesturechange", "gestureend"].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
  document.addEventListener("touchmove", e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
})();
