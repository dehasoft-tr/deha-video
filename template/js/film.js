// BAŞLANGIÇ FİLMİ: çalışır ve js/kit.js parçalarını (telefon, panel, liste, kontrol listesi, sayaç, halka, grafik) gösterir.
// Kendi sahnelerinle değiştir; sözleşmeyi koru:
//   - addLayer((t) => ...) ile kare çizen katmanlar ekle; her şey t'nin saf fonksiyonu olsun.
//   - window.SFX = [{ t, id, g }]  (id: assets/sfx içindeki dosya adı; g: 0-1 ses düzeyi)
//   - window.READY = yazı tipleri yüklenince çözülen Promise (render ve kare araçları bunu bekler)
// Zamanlamayı sabit saniyeyle değil kliplerle kur: T('c01', .4), P('c01', 'ifade'), B('cozum').a
(function () {
  const { ramp, E, addLayer, $, mk, T, BEATS, DUR, W, H, TL } = ENG, K = KIT;
  const dikey = H > W * 1.2, kare = !dikey && W < H * 1.3, SX = dikey ? 90 : kare ? 80 : 120, ST = dikey ? 200 : kare ? 90 : 110; // üç yerleşim: dikey, kare, yatay
  const first = BEATS[0], last = BEATS[BEATS.length - 1], mid = BEATS[Math.min(1, BEATS.length - 1)];
  // Başlıklar: [metin ('|' satır böler, '*...*' vurgulu satır), başlangıç, bitiş]
  const HL = [
    ['Sorunu|*tek cümleyle.*', 0.3, mid[1] - .05],
    ['Çözüm|*ve kazanç.*', mid[1], last[1] - .05],
    ['Akılda kalan|*kapanış.*', last[1], DUR + 5],
  ];
  const hl = $('#hl'), maxW = dikey ? W - 2 * SX : kare ? W * .4 : W * .42, base = dikey ? 150 : kare ? 92 : 128;
  const Hs = HL.map(([txt, a, b]) => {
    const el = mk(`<div class="h" style="left:${SX}px;top:${ST}px">${txt.split('|').map((l) => `<span class="ln">${l.replace(/\*/g, '').split(' ').map((w) => `<span class="w${l.startsWith('*') ? ' a' : ''}">${w}</span>`).join(' ')}</span>`).join('')}</div>`);
    hl.appendChild(el); return { el, a, b, words: [...el.querySelectorAll('.w')], lines: [...el.querySelectorAll('.ln')] };
  });
  const fit = () => Hs.forEach((h) => { // başlığı güvenli genişliğe sığdır (yazı tipi yüklendikten sonra ölçülür)
    h.el.style.display = 'block'; h.el.style.visibility = 'hidden'; h.el.style.fontSize = base + 'px';
    let mx = 0; h.lines.forEach((l) => { l.style.width = 'max-content'; mx = Math.max(mx, l.getBoundingClientRect().width / (window.__scale || 1)); l.style.width = ''; });
    h.el.style.fontSize = Math.max(dikey ? 110 : kare ? 64 : 84, Math.min(base, Math.floor(base * maxW / mx))) + 'px'; h.el.style.visibility = ''; h.el.style.display = 'none';
  });
  // Sahne: bir telefon (kahraman öğe) ve bir panel. Yerleşim orana göre hesaplanır; kadraj dolu kalır.
  const world = $('#world');
  const ph = dikey ? { w: 640, h: 1080, em: 30, x: (W - 640) / 2, y: 600 } : kare ? { w: 400, h: 800, em: 19, x: W - SX - 400, y: (H - 800) / 2 + 30 } : { w: 450, h: 880, em: 22, x: W * .56, y: (H - 880) / 2 };
  const phone = K.phone({ w: ph.w, h: ph.h, em: ph.em, title: 'Görevlerim' }); world.appendChild(phone.el);
  const list = K.checklist(['Birinci adım', 'İkinci adım', 'Üçüncü adım', 'Dördüncü adım']); phone.body.appendChild(list.el);
  const ring = K.ring({ size: ph.em * 9, to: 86, pre: '%' }); ring.el.style.margin = `${ph.em * 1.4}px auto ${ph.em}px`; phone.body.appendChild(ring.el);
  const btn = K.button('Gönder'); phone.body.appendChild(btn);
  const pn = dikey ? { w: W - 2 * SX, h: 1010, em: 30, x: SX, y: 640 } : kare ? { w: 500, h: 640, em: 17, x: W - SX - 500, y: (H - 640) / 2 + 60 } : { w: 860, h: 720, em: 26, x: W - SX - 860, y: (H - 720) / 2 + 30 };
  const panel = K.panel({ w: pn.w, h: pn.h, em: pn.em, title: 'Örnek Rapor', tag: 'Örnek veri', tabs: ['Özet', 'Liste', 'Rapor'], on: 0 }); world.appendChild(panel.el);
  const stats = mk(`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.8em;margin-bottom:1em"></div>`); panel.body.appendChild(stats);
  const s1 = K.stat({ label: 'Toplam', from: 90, to: 120 }), s2 = K.stat({ label: 'Tamamlanan', from: 60, to: 96 }), s3 = K.stat({ label: 'Tutar', from: 30000, to: 46200, pre: '₺', accent: true });
  [s1, s2, s3].forEach((s) => stats.appendChild(s.el));
  const rws = K.rows([{ t: 'Bayi A', sub: 'Örnek Ürün', pill: 'Tamam', tone: 'ok' }, { t: 'Bayi B', sub: 'Örnek Ürün', pill: 'Bekliyor', tone: 'w' }, { t: 'Bayi C', sub: 'Örnek Ürün', pill: 'Gecikti', tone: 'b' }, { t: 'Bayi D', sub: 'Örnek Ürün', val: '₺4.250' }]); panel.body.appendChild(rws.el);
  const chip = K.chip('Kendiliğinden', dikey ? 40 : 28); world.appendChild(chip);
  // Kapanış kartı: kendi logonu assets/ içine koy ve <img> ile değiştir.
  const lock = $('#lock'), lw = dikey ? W - 2 * SX : kare ? 560 : 720, lh = dikey ? 320 : 240;
  lock.innerHTML = `<div class="lk" style="left:${(W - lw) / 2}px;top:${dikey ? H * .58 : H * .56}px;width:${lw}px;height:${lh}px;font-size:${dikey ? 84 : 64}px;font-weight:800">Logo</div>`;
  const lk = $('.lk', lock), LK = T(TL.clips[TL.clips.length - 1].id, .6);
  addLayer((t) => {
    Hs.forEach((h) => {
      const on = t >= h.a - .02 && t < h.b + .1; h.el.style.display = on ? 'block' : 'none'; if (!on) return;
      // Çıkış, bir sonraki başlığın girişinden ÖNCE biter: iki başlık aynı anda yarım görünmez.
      h.words.forEach((w, i) => { const ent = ramp(t, h.a + .3 + i * .07, h.a + .9 + i * .07, E.out5), ex = ramp(t, h.b - .28 + i * .02, h.b + i * .02, E.in); w.style.transform = `translateY(${((1 - ent) * 125 - ex * 125).toFixed(1)}%)`; });
    });
    // 1. bölüm: telefon girer, liste işaretlenir, halka dolar. 2. bölüm: telefon küçülüp kenara çekilir, panel yükselir.
    const a0 = first[1], a1 = mid[1], a2 = last[1];
    const pin = ramp(t, a0 + .2, a0 + 1.1, E.spring), pout = ramp(t, a1 - .1, a1 + .7, E.io), fin = ramp(t, a2, a2 + .7, E.io);
    K.place(phone.el, ph.x - pout * (dikey ? 0 : kare ? 40 : 130), ph.y + (1 - pin) * H * .7 + pout * (dikey ? H : 0), 1 - pout * (dikey ? .1 : .12), (1 - pin) * 6, 1 - pout * (dikey ? 1 : .25) - fin * .75);
    list.check(ramp(t, a0 + 1.0, a1 - .9, E.lin)); ring.set(ramp(t, a0 + 1.6, a1 - .4, E.lin));
    const qin = ramp(t, a1 + .15, a1 + 1.0, E.out5);
    K.place(panel.el, pn.x, pn.y + (1 - qin) * H * .6 - fin * (dikey ? 120 : 40), 1 - fin * .08, (1 - qin) * -3, Math.min(1, qin * 3) * (1 - fin * .55));
    [s1, s2, s3].forEach((s, i) => s.set(ramp(t, a1 + .3 + i * .15, a1 + 1.8 + i * .15, E.lin))); rws.reveal(ramp(t, a1 + .5, a1 + 2.0, E.lin));
    const cin = ramp(t, a1 + 1.2, a1 + 1.8, E.back), cout = ramp(t, a2 - .3, a2, E.in);
    K.place(chip, pn.x + pn.w - (dikey ? 380 : 270), pn.y - (dikey ? 46 : 32), cin * (1 - cout), -4, cin * (1 - cout));
    const la = ramp(t, LK, LK + .9, E.spring); lock.style.display = t >= LK - .05 ? 'block' : 'none'; lk.style.transform = `translateY(${((1 - la) * 460).toFixed(1)}px)`;
  });
  window.SFX = [{ t: .3, id: 'whoosh', g: .5 }, ...BEATS.slice(1).map((b) => ({ t: b[1], id: 'whoosh', g: .5 })), { t: mid[1] + 1.2, id: 'ping', g: .4 }, { t: LK, id: 'shimmer', g: .5 }].sort((a, b) => a.t - b.t);
  window.READY = Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, 50))]).then(() => { fit(); ENG.render(0); });
})();
