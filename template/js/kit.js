// Hazır sahne parçaları. Her kurucu bir DOM öğesi döndürür; görünümü değiştiren işlevler yalnızca kendilerine verilen
// 0-1 arası ilerleme değerinden (u) hesap yapar: durum tutmazlar, bu yüzden kare kare render ile uyumludurlar.
// Ölçek: öğenin font-size'ı (em). Örn. dikey sahnede telefon için em=30 → gövde yazısı 30 px.
(function () {
  const { mk, clamp, lerp, E } = ENG;
  const fmt = (n, d = 0) => n.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const place = (el, x, y, s = 1, r = 0, o = 1) => { el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`; el.style.opacity = o.toFixed(3); };
  // Telefon: { w, h, em, title, time } → el, body (içerik buraya eklenir)
  function phone(o) {
    const el = mk(`<div class="k k-phone" style="width:${o.w}px;height:${o.h}px;font-size:${o.em}px"><div class="scr"><div class="isl"></div><div class="bar"><span>${o.time || '09:41'}</span><span>▮▮▮</span></div><div class="ttl">${o.title || ''}</div><div class="body"></div></div></div>`);
    return { el, body: el.querySelector('.body'), title: el.querySelector('.ttl') };
  }
  // Panel (masaüstü kartı): { w, h, em, title, tag, tabs:[...], on: etkin sekme sırası }
  function panel(o) {
    const tabs = o.tabs ? `<div class="tabs">${o.tabs.map((t, i) => `<span class="${i === (o.on || 0) ? 'on' : ''}">${t}</span>`).join('')}</div>` : '';
    const el = mk(`<div class="k k-panel${o.tabs ? '' : ' notabs'}" style="width:${o.w}px;height:${o.h}px;font-size:${o.em}px"><div class="hd"><span>${o.title || ''}</span>${o.tag ? `<span class="tag">${o.tag}</span>` : ''}</div>${tabs}<div class="body"></div></div>`);
    const tb = [...el.querySelectorAll('.tabs span')];
    return { el, body: el.querySelector('.body'), setTab: (i) => tb.forEach((t, j) => t.classList.toggle('on', i === j)) };
  }
  // Satır listesi: items = [{ t, sub, val, pill, tone:'ok'|'w'|'b', dot:true }] ; reveal(u): satırlar sırayla girer
  function rows(items) {
    const el = mk(`<div class="k-rows">${items.map((r) => `<div class="k-row">${r.dot === false ? '' : `<span class="dot ${r.tone === 'ok' || !r.tone ? '' : r.tone}"></span>`}<span>${r.t}${r.sub ? `<span class="sub">${r.sub}</span>` : ''}</span>${r.pill ? `<span class="pill ${r.tone || ''}">${r.pill}</span>` : r.val != null ? `<span class="val">${r.val}</span>` : ''}</div>`).join('')}</div>`);
    const rs = [...el.children];
    return { el, rows: rs, reveal: (u) => rs.forEach((r, i) => { const v = E.out5(clamp(u * (rs.length * .35 + 1) - i * .35)); r.style.opacity = v.toFixed(3); r.style.transform = `translateY(${((1 - v) * 1.6).toFixed(2)}em)`; }) };
  }
  // Kontrol listesi: items = ['metin', ...] ; check(u): kutular sırayla işaretlenir
  function checklist(items) {
    const el = mk(`<div class="k-rows">${items.map((t) => `<div class="k-check"><span class="bx"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span>${t}</span></div>`).join('')}</div>`);
    const bx = [...el.querySelectorAll('.bx')];
    return { el, check: (u) => bx.forEach((b, i) => { const v = clamp(u * bx.length - i); b.style.background = v > 0 ? 'var(--ok)' : 'transparent'; b.style.borderColor = v > 0 ? 'var(--ok)' : ''; b.firstChild.style.strokeDashoffset = (24 * (1 - E.out(v))).toFixed(1); }) };
  }
  // Sayı kutusu: { label, to, from, pre, suf, dec, accent } ; set(u): sayar. Görünür olduğu anda from değerindedir:
  // yanıltıcı bir "0" göstermemek için from'u anlamlı seç ya da kutuyu saymaya başladıktan sonra göster.
  function stat(o) {
    const el = mk(`<div class="k-stat${o.accent ? ' ac' : ''}"><div class="l">${o.label}</div><div class="n"></div></div>`), n = el.querySelector('.n');
    const set = (u) => { n.textContent = (o.pre || '') + fmt(lerp(o.from || 0, o.to, E.out(clamp(u))), o.dec || 0) + (o.suf || ''); }; set(0);
    return { el, set };
  }
  function progress() { const el = mk('<div class="k-prog"><i></i></div>'), i = el.firstChild; return { el, set: (u) => { i.style.transform = `scaleX(${clamp(u).toFixed(4)})`; } }; }
  // Puan halkası: { size (px), to, pre, suf } ; set(u). Sayı, halka dolmaya başlayınca görünür (boşken "0" göstermez).
  function ring(o) {
    const C = 2 * Math.PI * 45, el = mk(`<div class="k-ring" style="width:${o.size}px;height:${o.size}px"><svg viewBox="0 0 100 100"><circle class="bgc" cx="50" cy="50" r="45"/><circle class="fg" cx="50" cy="50" r="45" stroke-dasharray="${C.toFixed(2)}"/></svg><div class="n"></div></div>`);
    const fg = el.querySelector('.fg'), n = el.querySelector('.n');
    const set = (u) => { const v = E.out(clamp(u)) * o.to; fg.style.strokeDashoffset = (C * (1 - v / 100)).toFixed(2); n.textContent = (o.pre || '') + Math.round(v) + (o.suf || ''); n.style.opacity = clamp(u * 8).toFixed(2); }; set(0);
    return { el, set };
  }
  // Çubuk grafik: vals = [0-1,...], hi = vurgulu çubuk sırası ; grow(u)
  function bars(vals, hi = -1) {
    const el = mk(`<div class="k-bars">${vals.map((_, i) => `<i class="${i === hi ? 'hi' : ''}"></i>`).join('')}</div>`), bs = [...el.children];
    return { el, grow: (u) => bs.forEach((b, i) => { b.style.height = (vals[i] * 100).toFixed(1) + '%'; b.style.transform = `scaleY(${E.out5(clamp(u * (bs.length * .15 + 1) - i * .15)).toFixed(4)})`; }) };
  }
  const button = (t) => mk(`<div class="k-btn">${t}</div>`);
  // Etiket (sahnenin üstünde serbest dolaşır): place(el, x, y, ölçek, açı, opaklık) ile konumla
  const chip = (t, em = 34, dark = false) => mk(`<div class="k-chip${dark ? ' d' : ''}" style="font-size:${em}px">${t}</div>`);
  // Dokunma halkası: tap(el, x, y, u) → u 0'dan 1'e giderken halka büyüyüp söner
  const tapRing = (em = 30) => mk(`<div class="k-tap" style="font-size:${em}px"></div>`);
  const tap = (el, x, y, u) => { const v = clamp(u); el.style.opacity = (v > 0 && v < 1 ? 1 - v : 0).toFixed(3); el.style.transform = `translate(${x}px,${y}px) scale(${(0.4 + v * .9).toFixed(3)})`; };
  window.KIT = { fmt, place, phone, panel, rows, checklist, stat, progress, ring, bars, button, chip, tapRing, tap };
})();
