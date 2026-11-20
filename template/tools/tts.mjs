// Gemini TTS ile seslendirme. Ses ve model parametredir.
//   node tools/tts.mjs [--model <ad>] [--voice <ad>] [--only c02,c03] [--force] [--out assets/vo/raw] [--key-file <dosya>]
// Her istekte 60 sn zaman aşımı, 3 deneme; günlük kota hatasında durur (çıkış kodu 2).
// 3.x modelleri interactions uç noktasını, 2.5 modelleri generateContent (AUDIO) uç noktasını kullanır.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { root, FP, arg, has, readKey, narration } from './cfg.mjs';
const key = readKey(); const N = narration();
const persist = !arg('out');
if (arg('model') && persist) N.model = arg('model');
if (arg('voice') && persist) N.voice = arg('voice');
if ((arg('model') || arg('voice')) && persist) fs.writeFileSync(path.join(root, 'tools/narration.json'), JSON.stringify(N, null, 2) + '\n');
const model = arg('model') || N.model, voice = arg('voice') || N.voice;
const only = arg('only') ? arg('only').split(',') : null, force = has('force');
const raw = path.join(root, arg('out') || 'assets/vo/raw'); fs.mkdirSync(raw, { recursive: true });
const dur = (f) => parseFloat(execFileSync(FP, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
function wrapPcm(pcm, rate = 24000) { // 24 kHz, 16 bit, mono PCM -> WAV
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
async function synth(text, style) {
  const legacy = /2\.5/.test(model);
  let url, body;
  if (legacy) {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const t = style ? `Say in this tone (${style}): ${text}` : text;
    body = { contents: [{ parts: [{ text: t }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } };
  } else {
    url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
    // 3.1 modeli speech_metadata'yı reddeder: yönlendirme metnin başına köşeli parantezli etiket olarak girer.
    const item = /3\.1/.test(model) ? { type: 'text', text: style ? `[${style}] ${text}` : text } : { type: 'text', text, annotations: style ? [{ type: 'speech_metadata', style }] : [] };
    body = { model, input: [{ type: 'user_input', content: [item] }], response_format: { type: 'audio' }, generation_config: { speech_config: [{ voice }] } };
  }
  const r = await fetch(url, { method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 220));
  const j = await r.json();
  if (legacy) { const p = (j.candidates?.[0]?.content?.parts || []).find((x) => x.inlineData); if (!p) throw new Error('yanıtta ses yok'); return wrapPcm(Buffer.from(p.inlineData.data, 'base64')); }
  const au = (j.steps || []).filter((s) => s.type === 'model_output').flatMap((s) => s.content || []).filter((c) => c.type === 'audio').pop();
  if (!au) throw new Error('yanıtta ses yok');
  const buf = Buffer.from(au.data, 'base64');
  return buf.slice(0, 4).toString() === 'RIFF' ? buf : wrapPcm(buf);
}
console.log('model', model, '· ses', voice);
for (const g of N.clips) {
  const f = path.join(raw, g.id + '.wav');
  if (only && !only.includes(g.id)) continue;
  if (!only && !force && fs.existsSync(f)) continue;
  let ok = false, quota = false;
  for (let a = 0; a < 3 && !ok && !quota; a++) {
    try {
      fs.writeFileSync(f, await synth(g.t, g.style));
      const d = dur(f), cps = g.t.length / d;
      ok = cps > 8 && cps < 22; // bunun dışı genelde kesik ya da bozuk konuşmadır
      console.log(g.id, d.toFixed(2) + 's', cps.toFixed(1) + ' kr/sn', ok ? '' : 'ŞÜPHELİ');
    } catch (e) {
      const m = e.message.slice(0, 200); console.log(g.id, 'hata:', m);
      if (/per day|PerDay|requests per day/i.test(m)) quota = true; else await new Promise((r) => setTimeout(r, 10000));
    }
  }
  if (quota) { console.log('GÜNLÜK KOTA DOLDU, durduruldu:', model); process.exitCode = 2; break; }
  if (!ok) { console.log(g.id, 'BAŞARISIZ'); process.exitCode = 1; }
}
