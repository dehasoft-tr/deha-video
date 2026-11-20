// Filmi kare kare MP4'e (H.264 yuv420p) dönüştürür; ses ayrıca tools/mix.mjs ile eklenir. Boyut ve fps film.config.json'dan gelir.
//   node tools/render.mjs [--workers 4] [--from 0] [--to <sn>] [--out out/video.mp4]
// Her işçi kendi başlıksız Chromium'unu açar, window.seek(i/fps) çağırır, ekran görüntüsünü doğrudan FFmpeg'e akıtır.
import { chromium } from 'playwright-core'; import { spawn } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchOpts } from './browser.mjs'; import { root, cfg, FF, arg } from './cfg.mjs';
const FPS = cfg.fps, tmp = path.join(root, 'out', 'tmp'), URL = pathToFileURL(path.join(root, 'index.html')).href + '?render=1';
async function worker(idx, f0, f1) {
  const seg = path.join(tmp, `seg_${String(idx).padStart(2, '0')}.mp4`);
  const ff = spawn(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', 'pipe:0',
    '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-g', String(FPS * 2), '-bf', '2', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  const b = await chromium.launch(launchOpts()); const p = await b.newPage({ viewport: { width: cfg.width, height: cfg.height }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => { console.error(`[w${idx}] pageerror`, e.message); process.exitCode = 1; });
  await p.goto(URL); await p.evaluate(() => window.READY);
  for (let i = f0; i < f1; i++) {
    await p.evaluate((s) => window.seek(s), i / FPS);
    const buf = await p.screenshot({ type: 'png' });
    if (buf.length < 1500) throw new Error(`kare ${i} şüpheli derecede küçük (${buf.length} bayt): boş kare olabilir`);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - f0) % 150 === 0) console.log(`[w${idx}] ${i - f0}/${f1 - f0}`);
  }
  ff.stdin.end(); await b.close(); await done; console.log(`[w${idx}] bitti`);
}
async function main() {
  const b0 = await chromium.launch(launchOpts()); const p0 = await b0.newPage(); await p0.goto(URL); await p0.evaluate(() => window.READY);
  const meta = await p0.evaluate(() => ({ dur: window.FILM.DUR, sfx: window.SFX, clips: window.TL.clips, beats: window.BEATS, voice: window.TL.voice, provisional: !!window.TL.provisional })); await b0.close();
  if (meta.provisional) console.log('UYARI: çizelge TASLAK (tahmini süreler). Seslendirmeli film için önce tts + build-vo çalıştır.');
  const N = parseInt(arg('workers', '4'), 10), from = parseFloat(arg('from', '0')), to = Math.min(parseFloat(arg('to', String(meta.dur))), meta.dur);
  const out = path.resolve(root, arg('out', 'out/video.mp4')); const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS), total = f1 - f0;
  fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(path.join(root, 'out', 'cues.json'), JSON.stringify(meta, null, 1));
  const t0 = Date.now(), per = Math.ceil(total / N), kids = [];
  for (let k = 0; k < N; k++) { const a = f0 + k * per, b = Math.min(f1, a + per); if (a >= b) break;
    kids.push(new Promise((res, rej) => { const ch = spawn(process.execPath, [fileURLToPath(import.meta.url), '--worker', String(k), String(a), String(b)], { stdio: 'inherit' }); ch.on('close', (c) => (c === 0 ? res() : rej(new Error(`işçi ${k} kod ${c}`)))); })); }
  await Promise.all(kids); console.log('kareler tamam', ((Date.now() - t0) / 1000).toFixed(0), 's');
  const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, kids.map((_, k) => `file 'seg_${String(k).padStart(2, '0')}.mp4'`).join('\n') + '\n');
  await new Promise((res, rej) => spawn(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' }).on('close', (c) => (c ? rej(new Error('concat')) : res())));
  fs.rmSync(tmp, { recursive: true, force: true }); console.log('VİDEO TAMAM', out, `${cfg.width}x${cfg.height}`, FPS + 'fps', total, 'kare');
}
if (process.argv[2] === '--worker') worker(+process.argv[3], +process.argv[4], +process.argv[5]).catch((e) => { console.error(e); process.exit(1); });
else main().catch((e) => { console.error(e); process.exit(1); });
