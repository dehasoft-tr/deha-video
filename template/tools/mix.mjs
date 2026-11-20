// Ses karışımı: seslendirme üstte, efektler seslendirme sürerken kısılır; ~-16 LUFS; videoyla birleştirip out/final.mp4 yazar.
//   node tools/mix.mjs [--video out/video.mp4] [--out out/final.mp4] [--music assets/music.mp3 --music-gain 0.12]
// Seslendirme klibi yoksa (seslendirmesiz film) yalnız efektler karıştırılır.
import { spawnSync, execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
import { root, FF, arg } from './cfg.mjs';
const cues = JSON.parse(fs.readFileSync(path.join(root, 'out/cues.json'), 'utf8')); const dur = cues.dur.toFixed(3);
const video = path.resolve(root, arg('video', 'out/video.mp4')), out = path.resolve(root, arg('out', 'out/final.mp4')), wav = path.join(root, 'out/mix.wav');
const ins = ['-f', 'lavfi', '-t', dur, '-i', 'anullsrc=r=48000:cl=stereo']; const fc = []; let n = 1; const sx = ['[0:a]'], vx = [];
const add = (file, t, g, bag, tag) => { if (!fs.existsSync(file)) { console.log('yok, atlandı:', path.relative(root, file)); return; } ins.push('-i', file); const ms = Math.round(t * 1000); fc.push(`[${n}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${g},adelay=${ms}|${ms}[${tag}${n}]`); bag.push(`[${tag}${n}]`); n++; };
(cues.sfx || []).forEach((q) => add(path.join(root, 'assets/sfx', q.id + '.mp3'), q.t, q.g, sx, 's'));
if (arg('music')) add(path.resolve(root, arg('music')), 0, parseFloat(arg('music-gain', '0.12')), sx, 'm');
(cues.clips || []).forEach((c) => add(path.join(root, 'assets/vo', c.id + '.mp3'), c.t, 1, vx, 'v'));
fc.push(`${sx.join('')}amix=inputs=${sx.length}:duration=first:normalize=0[sfx]`);
if (vx.length) {
  fc.push(`${vx.join('')}amix=inputs=${vx.length}:duration=longest:normalize=0,apad=whole_dur=${dur},asplit=2[vo][vk]`);
  fc.push('[sfx][vk]sidechaincompress=threshold=0.02:ratio=9:attack=15:release=350:makeup=1[sd]');
  fc.push('[sd][vo]amix=inputs=2:duration=first:normalize=0[mixed]');
} else { console.log('seslendirme klibi yok: yalnız efektler'); fc.push('[sfx]anull[mixed]'); }
const run = (extra) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...ins, '-filter_complex', fc.join(';') + extra, '-map', '[a]', '-t', dur, '-ar', '48000', '-ac', '2', wav], { stdio: 'inherit' });
const meas = (f) => { const r = spawnSync(FF, ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; const g = (re) => parseFloat(r.match(re).pop().match(/-?[\d.]+/)[0]); return { I: g(/I:\s+(-?[\d.]+) LUFS/g), TP: g(/Peak:\s+(-?[\d.]+) dBFS/g) }; };
run(';[mixed]anull[a]'); const m0 = meas(wav);
if (vx.length && isFinite(m0.I)) { const gain = -16 - m0.I; run(`;[mixed]volume=${gain.toFixed(2)}dB,alimiter=limit=0.89:attack=3:release=60:level=disabled[a]`); console.log('karışım önce', m0, 'kazanç', gain.toFixed(2), 'sonra', meas(wav)); }
else console.log('karışım', m0);
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', dur, '-movflags', '+faststart', out], { stdio: 'inherit' });
fs.rmSync(wav, { force: true }); console.log('FINAL', out);
