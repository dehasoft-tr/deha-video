// Bitmiş MP4'ü doğrular: ffprobe (kodek, boyut, fps, süre, ses), ses yüksekliği, siyah kare taraması ve göz kontrolü için
// eşit aralıklı 12 karelik iki şerit (out/kontrol-a.jpg, out/kontrol-b.jpg). Şeritleri AÇIP BAK; bu betik kareleri yorumlamaz.
//   node tools/kontrol.mjs [out/final.mp4]
import { execFileSync, spawnSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path'; import { root, cfg, FF, FP } from './cfg.mjs';
const f = path.resolve(root, process.argv[2] || 'out/final.mp4'); let hata = 0;
const pr = JSON.parse(execFileSync(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f]).toString());
const v = pr.streams.find((s) => s.codec_type === 'video'), a = pr.streams.find((s) => s.codec_type === 'audio'), dur = parseFloat(pr.format.duration);
const chk = (ok, m) => { console.log((ok ? 'TAMAM  ' : 'HATA   ') + m); if (!ok) hata++; };
chk(v.codec_name === 'h264' && v.pix_fmt === 'yuv420p', `video ${v.codec_name} ${v.pix_fmt}`);
chk(v.width === cfg.width && v.height === cfg.height, `boyut ${v.width}x${v.height} (beklenen ${cfg.width}x${cfg.height})`);
chk(v.r_frame_rate === cfg.fps + '/1', `fps ${v.r_frame_rate}`);
chk(!!a, a ? `ses ${a.codec_name} ${a.sample_rate} Hz` : 'ses akışı yok');
console.log('       süre ' + dur.toFixed(2) + ' sn');
const er = spawnSync(FF, ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-vf', 'blackdetect=d=0.4:pix_th=0.03', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const I = (er.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop(), TP = (er.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop(); console.log('       ses yüksekliği ' + (I || '?') + ' · ' + (TP || '?'));
const siyah = er.match(/black_start:[\d.]+ black_end:[\d.]+/g) || []; chk(!siyah.length, siyah.length ? 'siyah bölümler: ' + siyah.join(' | ') : 'siyah bölüm yok');
const w = cfg.width >= cfg.height ? 480 : 300, tmp = path.join(root, 'out/tmp-k'); fs.mkdirSync(tmp, { recursive: true }); const fr = [];
for (let i = 0; i < 12; i++) { const o = path.join(tmp, i + '.png'); execFileSync(FF, ['-v', 'error', '-y', '-ss', String(dur * (i + 0.5) / 12), '-i', f, '-frames:v', '1', '-vf', `scale=${w}:-2`, o]); fr.push(o); }
const per = cfg.width >= cfg.height ? 3 : 6; let k = 0;
for (let i = 0; i < 12; i += per * (cfg.width >= cfg.height ? 2 : 1)) {
  const grp = fr.slice(i, i + per * (cfg.width >= cfg.height ? 2 : 1)); const o = path.join(root, 'out', `kontrol-${'ab'[k++]}.jpg`);
  const lay = cfg.width >= cfg.height ? `xstack=inputs=${grp.length}:layout=${grp.map((_, j) => `${(j % per) * w}_${Math.floor(j / per) * Math.round(w * cfg.height / cfg.width / 2) * 2}`).join('|')}` : `hstack=inputs=${grp.length}`;
  execFileSync(FF, ['-v', 'error', '-y', ...grp.flatMap((x) => ['-i', x]), '-filter_complex', lay, o]); console.log('       şerit ' + o);
}
fs.rmSync(tmp, { recursive: true, force: true }); process.exitCode = hata ? 1 : 0;
