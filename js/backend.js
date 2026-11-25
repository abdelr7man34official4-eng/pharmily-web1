/* =========================================================
   backend.js — طبقة الاتصال بالبيانات (سكريبت عادي مش module علشان يفتح بدوبل كليك)
   - على الإنترنت (GitHub Pages) وبعد ما تحطي بيانات Firebase: بيشتغل بـ Firebase الحقيقي
   - لما الملف يتفتح من الجهاز مباشرة (file://): "وضع المعاينة" بيحفظ على جهازك بس
   ========================================================= */
(function () {
  const cfg = window.firebaseConfig || {};
  const cfgOK = !!(cfg.apiKey && !/PASTE|YOUR/i.test(cfg.apiKey));
  const demo = location.protocol === "file:";
  const P = (...a) => a.join("/");

  /* ---------- أدوات مشتركة (مراجع بسيطة بالمسار) ---------- */
  const common = {
    doc: (base, ...seg) => ({ type: "doc", path: base && base.type ? P(base.path, ...seg) : P(...seg), id: seg[seg.length - 1] }),
    collection: (base, ...seg) => ({ type: "col", path: base && base.type ? P(base.path, ...seg) : P(...seg) }),
    where: (f, op, v) => ({ t: "where", f, op, v }),
    orderBy: (f, dir = "asc") => ({ t: "order", f, dir }),
    limit: n => ({ t: "limit", n }),
    query: (col, ...cons) => ({ type: "query", path: col.path, cons }),
    browserLocalPersistence: "local", browserSessionPersistence: "session"
  };

  /* =========================================================
     وضع المعاينة (على الجهاز)
     ========================================================= */
  function makeDemo() {
    const K = "ph_demo_db", A = "ph_demo_auth", U = "ph_demo_uid";
    let db = {}; try { db = JSON.parse(localStorage.getItem(K) || "{}"); } catch (e) { }
    const listeners = new Set(), authL = new Set();
    const save = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch (e) { alert("مفيش مساحة كفاية لحفظ المعاينة. جرّبي صور أصغر."); } };
    const clone = o => JSON.parse(JSON.stringify(o));
    const wrap = v => Array.isArray(v) ? v.map(wrap) : (v && typeof v === "object") ? (v.__t !== undefined ? { toMillis: () => v.__t, toDate: () => new Date(v.__t) } : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, wrap(x)]))) : v;
    const resolve = (nv, old) => {
      if (nv && nv.__sv === "ts") return { __t: Date.now() };
      if (nv && nv.__sv === "inc") return (typeof old === "number" ? old : 0) + nv.n;
      if (Array.isArray(nv)) return nv;
      if (nv && typeof nv === "object") { const o = {}; for (const k in nv) o[k] = resolve(nv[k], old && old[k]); return o; }
      return nv;
    };
    const merge = (a, b) => { const o = { ...(a || {}) }; for (const k in b) o[k] = (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && b[k].__t === undefined && o[k] && typeof o[k] === "object") ? merge(o[k], b[k]) : b[k]; return o; };
    const notify = () => listeners.forEach(f => f());
    const write = (path, data, mode) => {
      const old = db[path];
      if (mode === "update" && !old) throw Object.assign(new Error("not-found"), { code: "not-found" });
      const r = resolve(data, old); db[path] = mode === "set" ? r : merge(old, r); save(); notify();
    };
    window.addEventListener("storage", e => { if (e.key === K) { try { db = JSON.parse(e.newValue || "{}"); } catch (x) { } notify(); } });
    const parent = p => p.split("/").slice(0, -1).join("/");
    const run = q => {
      let list = Object.keys(db).filter(p => parent(p) === q.path).map(p => ({ id: p.split("/").pop(), path: p, d: db[p] }));
      for (const c of q.cons || []) {
        if (c.t === "where") list = list.filter(x => c.op === "==" ? x.d[c.f] === c.v : (x.d[c.f] || []).includes(c.v));
        if (c.t === "order") list.sort((a, b) => { const g = x => { const v = x.d[c.f]; return v && v.__t !== undefined ? v.__t : v; }; return (g(a) > g(b) ? 1 : -1) * (c.dir === "desc" ? -1 : 1); });
        if (c.t === "limit") list = list.slice(0, c.n);
      }
      return list;
    };
    const snapOf = (list, prev) => {
      const docs = list.map(x => ({ id: x.id, ref: { path: x.path }, data: () => wrap(clone(x.d)), exists: () => true }));
      const pm = new Map((prev || []).map(x => [x.path, JSON.stringify(x.d)]));
      const ch = list.map(x => ({ type: pm.has(x.path) ? (pm.get(x.path) === JSON.stringify(x.d) ? null : "modified") : "added", doc: docs.find(d => d.ref.path === x.path) })).filter(c => c.type);
      return { docs, size: docs.length, forEach: f => docs.forEach(f), docChanges: () => ch };
    };
    const docSnap = (path, id) => { const d = db[path]; return { exists: () => !!d, data: () => d ? wrap(clone(d)) : undefined, id }; };
    const accounts = () => { try { return JSON.parse(localStorage.getItem(A) || "{}"); } catch (e) { return {}; } };
    const cur = () => { const u = sessionStorage.getItem(U) || localStorage.getItem(U); if (!u) return null; const a = accounts(); const e = Object.keys(a).find(k => a[k].uid === u); return e ? { uid: u, email: e } : null; };
    const fire = () => authL.forEach(f => f(cur()));
    let persist = "local";
    const login = u => { sessionStorage.removeItem(U); localStorage.removeItem(U); (persist === "local" ? localStorage : sessionStorage).setItem(U, u.uid); fire(); };
    return {
      ...common, auth: {}, db: {},
      serverTimestamp: () => ({ __sv: "ts" }), increment: n => ({ __sv: "inc", n }),
      setPersistence: async (_, p) => { persist = p; },
      createUserWithEmailAndPassword: async (_, email, pw) => { const a = accounts(); if (a[email]) throw { code: "auth/email-already-in-use" }; a[email] = { uid: "u" + Math.random().toString(36).slice(2, 10), pw }; localStorage.setItem(A, JSON.stringify(a)); const u = { uid: a[email].uid, email }; login(u); return { user: u }; },
      signInWithEmailAndPassword: async (_, email, pw) => { const a = accounts(); if (!a[email] || a[email].pw !== pw) throw { code: "auth/invalid-credential" }; const u = { uid: a[email].uid, email }; login(u); return { user: u }; },
      signOut: async () => { sessionStorage.removeItem(U); localStorage.removeItem(U); fire(); },
      onAuthStateChanged: (_, cb) => { authL.add(cb); setTimeout(() => cb(cur()), 30); return () => authL.delete(cb); },
      setDoc: async (r, d, o) => write(r.path, d, o && o.merge ? "merge" : "set"),
      updateDoc: async (r, d) => write(r.path, d, "update"),
      addDoc: async (c, d) => { const id = "d" + Math.random().toString(36).slice(2, 10); write(P(c.path, id), d, "set"); return { type: "doc", path: P(c.path, id), id }; },
      deleteDoc: async r => { delete db[r.path]; save(); notify(); },
      getDoc: async r => docSnap(r.path, r.id),
      getDocs: async q => snapOf(run(q.type === "query" ? q : { path: q.path, cons: [] })),
      onSnapshot: (ref, cb) => {
        let prev = null;
        const f = () => {
          if (ref.type === "doc") return cb(docSnap(ref.path, ref.id));
          const list = run(ref.type === "query" ? ref : { path: ref.path, cons: [] });
          const s = snapOf(list, prev); prev = list.map(x => ({ ...x, d: clone(x.d) })); cb(s);
        };
        listeners.add(f); setTimeout(f, 0); return () => listeners.delete(f);
      }
    };
  }

  /* =========================================================
     Firebase الحقيقي (compat SDK = سكريبت عادي)
     ========================================================= */
  function makeReal() {
    firebase.initializeApp(cfg);
    const au = firebase.auth(), fs = firebase.firestore();
    const FV = firebase.firestore.FieldValue;
    const col = r => fs.collection(r.path);
    const build = q => { let x = fs.collection(q.path); for (const c of q.cons || []) { if (c.t === "where") x = x.where(c.f, c.op, c.v); else if (c.t === "order") x = x.orderBy(c.f, c.dir); else if (c.t === "limit") x = x.limit(c.n); } return x; };
    const dsnap = s => ({ exists: () => s.exists, data: () => s.data(), id: s.id });
    const target = r => r.type === "doc" ? fs.doc(r.path) : r.type === "query" ? build(r) : col(r);
    return {
      ...common, auth: au, db: fs,
      serverTimestamp: () => FV.serverTimestamp(), increment: n => FV.increment(n),
      setPersistence: (a, p) => a.setPersistence(p === "local" ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION),
      createUserWithEmailAndPassword: (a, e, p) => a.createUserWithEmailAndPassword(e, p),
      signInWithEmailAndPassword: (a, e, p) => a.signInWithEmailAndPassword(e, p),
      signOut: a => a.signOut(),
      onAuthStateChanged: (a, cb) => a.onAuthStateChanged(cb),
      setDoc: (r, d, o) => fs.doc(r.path).set(d, o),
      updateDoc: (r, d) => fs.doc(r.path).update(d),
      addDoc: async (c, d) => { const x = await col(c).add(d); return { type: "doc", path: x.path, id: x.id }; },
      deleteDoc: r => fs.doc(r.path).delete(),
      getDoc: async r => dsnap(await fs.doc(r.path).get()),
      getDocs: q => target(q).get(),
      onSnapshot: (r, cb, err) => r.type === "doc" ? fs.doc(r.path).onSnapshot(s => cb(dsnap(s)), err) : target(r).onSnapshot(cb, err)
    };
  }

  let api = null, error = null;
  try {
    if (demo) api = makeDemo();
    else if (cfgOK && typeof firebase !== "undefined") api = makeReal();
  } catch (e) { error = e; console.error("backend init failed", e); }
  window.PH_FB = Object.assign(api || {}, { demo, ready: !!api, error });
})();
