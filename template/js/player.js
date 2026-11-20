// Oynatıcı: oynat/duraklat/başa sar, zaman çubuğu, seslendirme ve efekt düğmeleri. ?render=1 ile denetimler gizlenir.
(function () {
  const q = new URLSearchParams(location.search), RENDER = q.has('render'), W = CFG.W, H = CFG.H;
  if (RENDER) document.body.classList.add('render');
  const stage = document.getElementById('stage');
  function fit() { const w = innerWidth, h = innerHeight - 56, k = Math.min(w / W, h / H); window.__scale = k; stage.style.transform = `translate(${-W / 2 * k}px,${-H / 2 * k - 28}px) scale(${k})`; }
  if (!RENDER) { addEventListener('resize', fit); fit(); } else window.__scale = 1;
  const DUR = ENG.DUR; let playing = false, t0 = 0, base = 0, cur = 0, lastT = 0;
  const clock = document.getElementById('clock'), scrub = document.getElementById('scrub'), bPlay = document.getElementById('bPlay');
  const cV = document.getElementById('cVoice'), cS = document.getElementById('cSfx');
  const mm = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const voice = {}, fx = {};
  if (!RENDER) { TL.clips.forEach((c) => { const a = new Audio('assets/vo/' + c.id + '.mp3'); a.preload = 'auto'; voice[c.id] = a; }); [...new Set(window.SFX.map((e) => e.id))].forEach((n) => { const a = new Audio('assets/sfx/' + n + '.mp3'); a.preload = 'auto'; fx[n] = a; }); }
  function stopAll() { Object.values(voice).forEach((a) => a.pause()); }
  function sync(t, jump) {
    if (RENDER) return;
    TL.clips.forEach((c) => { const a = voice[c.id]; const inside = t >= c.t && t < c.t + c.dur; a.muted = !cV.checked; if (inside && playing) { if (jump || a.paused || Math.abs(a.currentTime - (t - c.t)) > 0.25) { a.currentTime = t - c.t; a.play().catch(() => {}); } } else if (!a.paused) a.pause(); });
    const talking = TL.clips.some((c) => t >= c.t && t < c.t + c.dur);
    if (playing && !jump) window.SFX.forEach((e) => { if (e.t > lastT && e.t <= t && cS.checked && fx[e.id]) { const a = fx[e.id].cloneNode(); a.volume = Math.min(1, e.g * (talking ? 0.4 : 1)); a.play().catch(() => {}); } });
  }
  function show(t, jump) { cur = Math.min(Math.max(t, 0), DUR - 0.001); ENG.render(cur); clock.textContent = mm(cur) + ' / ' + mm(DUR); scrub.value = Math.round((cur / DUR) * 1000); sync(cur, jump); lastT = cur; }
  function loop() { if (!playing) return; const t = base + (performance.now() - t0) / 1000; if (t >= DUR) { playing = false; bPlay.textContent = 'Oynat'; stopAll(); show(DUR - 0.001); return; } show(t); requestAnimationFrame(loop); }
  function play() { if (cur >= DUR - 0.05) cur = 0; playing = true; base = cur; t0 = performance.now(); bPlay.textContent = 'Duraklat'; show(cur, true); requestAnimationFrame(loop); }
  function pause() { playing = false; bPlay.textContent = 'Oynat'; stopAll(); }
  bPlay.onclick = () => (playing ? pause() : play());
  document.getElementById('bRestart').onclick = () => { pause(); show(0, true); play(); };
  scrub.oninput = () => { const was = playing; if (was) pause(); show((scrub.value / 1000) * DUR, true); if (was) play(); };
  cV.onchange = () => sync(cur, true);
  window.FILM = { DUR, beats: window.BEATS, sfx: window.SFX, clips: TL.clips };
  window.READY.then(() => { if (!RENDER) show(0, true); });
})();
