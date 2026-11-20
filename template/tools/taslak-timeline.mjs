// Ses klipleri yokken (seslendirmeden önce ya da seslendirmesiz film için) metin uzunluğundan TAHMİNİ çizelge üretir.
//   node tools/taslak-timeline.mjs [--cps 13.5] [--gap 0.3] [--tail 2.6]   ->  assets/timeline.js (provisional: true)
// Seslendirmeli filmde gerçek klipler gelince build-vo.mjs bunun üzerine yazar; taslakla final render alınmaz.
import fs from 'node:fs'; import path from 'node:path'; import { root, arg, narration } from './cfg.mjs';
const N = narration(); const CPS = parseFloat(arg('cps', '13.5')), GAP = parseFloat(arg('gap', '0.3')), TAIL = parseFloat(arg('tail', '2.6'));
let t = 0.35; const clips = N.clips.map((c) => { const dur = +(c.dur || c.t.length / CPS).toFixed(3); const o = { id: c.id, beat: c.beat, t: +t.toFixed(3), dur, text: c.t }; t += dur + GAP; return o; });
const DUR = +(t - GAP + TAIL).toFixed(3);
fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
fs.writeFileSync(path.join(root, 'assets/timeline.js'), 'window.TL=' + JSON.stringify({ voice: N.voice, model: N.model, provisional: true, dur: DUR, clips }) + ';\n');
console.log('TASLAK çizelge · tahmini süre', DUR, 'sn ·', N.clips.reduce((n, c) => n + c.t.split(/\s+/).length, 0), 'kelime');
