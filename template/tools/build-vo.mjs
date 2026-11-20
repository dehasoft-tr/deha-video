// Ham klipleri işler (sessizlik kırp, tempo, tek kazançla ~-16 LUFS, tepe sınırı), süreleri ve çizelgeyi üretir.
//   node tools/build-vo.mjs [--tempo 1.0] [--gap 0.3] [--tail 2.6]  ->  assets/vo/*.mp3, assets/timeline.js (window.TL)
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync, spawnSync } from 'node:child_process';
import { root, FF, FP, arg, narration } from './cfg.mjs';
const N = narration();
const TEMPO = parseFloat(arg('tempo', '1.0')), TARGET = -16, START = 0.35, GAP = parseFloat(arg('gap', '0.3')), TAIL = parseFloat(arg('tail', '2.6'));
const vo = path.join(root, 'assets/vo'), tmp = path.join(root, 'out/tmp-vo'); fs.mkdirSync(tmp, { recursive: true });
const trim = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04,areverse';
for (const c of N.clips) execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(vo, 'raw', c.id + '.wav'), '-af', `${trim},atempo=${TEMPO},aresample=48000`, path.join(tmp, c.id + '.wav')]);
fs.writeFileSync(path.join(tmp, 'all.txt'), N.clips.map((c) => `file '${c.id}.wav'`).join('\n'));
const meas = (args) => { const r = spawnSync(FF, ['-hide_banner', '-nostats', ...args, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; const g = (re) => parseFloat(r.match(re).pop().match(/-?[\d.]+/)[0]); return { I: g(/I:\s+(-?[\d.]+) LUFS/g), TP: g(/Peak:\s+(-?[\d.]+) dBFS/g) }; };
const m0 = meas(['-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'all.txt')]);
const gain = TARGET - m0.I + 0.8;
let t = START; const clips = [];
for (const c of N.clips) {
  const out = path.join(vo, c.id + '.mp3');
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(tmp, c.id + '.wav'), '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.85:attack=3:release=60:level=disabled,afade=t=in:d=0.01`, '-ac', '1', '-ar', '48000', '-c:a', 'libmp3lame', '-b:a', '160k', out]);
  const dur = parseFloat(execFileSync(FP, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString());
  clips.push({ id: c.id, beat: c.beat, t: +t.toFixed(3), dur: +dur.toFixed(3), text: c.t }); t += dur + GAP;
}
const DUR = +(t - GAP + TAIL).toFixed(3);
fs.writeFileSync(path.join(root, 'assets/timeline.js'), 'window.TL=' + JSON.stringify({ voice: N.voice, model: N.model, dur: DUR, clips }) + ';\n');
fs.writeFileSync(path.join(vo, 'manifest.json'), JSON.stringify({ voice: N.voice, model: N.model, tempo: TEMPO, gain_db: +gain.toFixed(2), dur: DUR, clips }, null, 1));
fs.rmSync(tmp, { recursive: true, force: true });
console.log('ham', m0.I, 'LUFS tepe', m0.TP, 'kazanç', gain.toFixed(2), '· FİLM SÜRESİ', DUR, 'sn'); clips.forEach((c) => console.log(c.id, c.t, '->', (c.t + c.dur).toFixed(2), c.beat));
