// Her kare, zamanın saf fonksiyonudur: durum tutulmaz, Date.now()/Math.random() kullanılmaz (rastgelelik gerekiyorsa rnd(i)).
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const E = {
    lin: (t) => t, out: (t) => 1 - Math.pow(1 - t, 3), out5: (t) => 1 - Math.pow(1 - t, 5), in: (t) => t * t * t, in2: (t) => t * t,
    io: (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), io2: (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    elastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1),
    spring: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-6.5 * t) * Math.cos(t * 9.5)),
  };
  // ramp(t, a, b): a anında 0, b anında 1 (eğriyle). Giriş/çıkışların temel taşı.
  const ramp = (t, a, b, e = E.out) => e(clamp((t - a) / (b - a)));
  // kf(t, [[t0,v0],[t1,v1,ease],...]): anahtar kareler arası değer
  const kf = (t, arr) => {
    if (t <= arr[0][0]) return arr[0][1];
    const L = arr[arr.length - 1]; if (t >= L[0]) return L[1];
    for (let i = 1; i < arr.length; i++) if (t < arr[i][0]) { const a = arr[i - 1], b = arr[i]; return lerp(a[1], b[1], (b[2] || E.io)((t - a[0]) / (b[0] - a[0]))); }
    return L[1];
  };
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const rnd = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }; // tohumlu, kareden bağımsız
  const TL = window.TL, DUR = TL.dur, W = window.CFG.W, H = window.CFG.H;
  const C = (id) => { const c = TL.clips.find((x) => x.id === id); if (!c) throw new Error('klip yok: ' + id); return c; };
  // T('c03', 1.2): c03 klibinin başlamasından 1.2 sn sonrası.  P('c03','ifade'): metindeki ifadenin yaklaşık söylenme anı.
  const T = (id, off = 0) => C(id).t + off;
  const P = (id, sub, off = 0) => { const c = C(id), i = c.text.indexOf(sub); if (i < 0) throw new Error('ifade yok: ' + sub); return c.t + c.dur * (0.02 + 0.96 * (i / c.text.length)) + off; };
  // Bölümler: narration.json'daki "beat" adlarından; her bölüm ilk klibinin biraz öncesinde başlar.
  const BEATS = []; TL.clips.forEach((c) => { const L = BEATS[BEATS.length - 1]; if (!L || L[0] !== c.beat) BEATS.push([c.beat, Math.max(0, c.t - 0.1), 0]); });
  BEATS.forEach((b, i) => { b[2] = i + 1 < BEATS.length ? BEATS[i + 1][1] : DUR; }); BEATS[0][1] = 0;
  const B = (name) => { const b = BEATS.find((x) => x[0] === name); if (!b) throw new Error('bölüm yok: ' + name); return { a: b[1], b: b[2] }; };
  const layers = [];
  const addLayer = (fn) => layers.push(fn);
  const $ = (s, r = document) => r.querySelector(s);
  const mk = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
  function render(t) { t = clamp(t, 0, DUR - 1 / 600); for (const f of layers) f(t); window.__t = t; }
  window.BEATS = BEATS;
  window.ENG = { clamp, lerp, E, ramp, kf, mixc, rnd, C, T, P, B, BEATS, TL, DUR, W, H, addLayer, $, mk, render };
  window.renderAt = (t) => { render(t); return t; };
  window.seek = (t) => { render(t); };
})();
