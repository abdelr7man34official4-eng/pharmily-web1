/* أصوات الضغط: صوت ناعم وحديث متولّد بالكود (من غير ملفات) — بيشتغل لما تدوسي على أي أيكون/زرار/كارت */
(() => {
  let ctx = null, last = 0;
  const ac = () => {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  function tone(c, t, f0, f1, dur, vol, type = "sine") {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
  }
  function tap() {            // pop ناعم قصير
    const c = ac(); if (!c) return; const t = c.currentTime;
    tone(c, t, 520, 880, .11, .09); tone(c, t, 1560, 1760, .05, .025);
  }
  function chime() {          // نغمتين لامعتين للأزرار الأساسية والريأكشنز
    const c = ac(); if (!c) return; const t = c.currentTime;
    tone(c, t, 784, 784, .16, .08); tone(c, t + .07, 1175, 1175, .22, .07); tone(c, t + .07, 2350, 2350, .1, .015);
  }
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest?.("button,a,[data-act],.btn,.circle,.st,.mc,label.drop,summary");
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    const n = performance.now(); if (n - last < 70) return; last = n;
    try { el.matches(".primary,[data-act='share'],[data-act='react'],.rxb,.send") ? chime() : tap(); } catch (_) {}
  }, { passive: true });
})();
