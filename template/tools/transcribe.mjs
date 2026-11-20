// Klipleri Gemini ile metne geri çevirir (doğrulama). Metinle farkı da gösterir.
//   node tools/transcribe.mjs [--judge] [--key-file <dosya>] [wav ...]      (dosya verilmezse assets/vo/raw/*.wav)
import fs from 'node:fs'; import path from 'node:path'; import { root, readKey, narration } from './cfg.mjs';
const key = readKey(); const a = process.argv.slice(2); const judge = a.includes('--judge');
let files = a.filter((x, i) => !x.startsWith('--') && a[i - 1] !== '--key-file');
const N = narration(); if (!files.length) files = N.clips.map((c) => path.join(root, 'assets/vo/raw', c.id + '.wav')).filter((f) => fs.existsSync(f));
const model = process.env.TRANSCRIBE_MODEL || 'gemini-3.8-flash';
async function transcribe(file, prompt) {
  const body = { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'audio/wav', data: fs.readFileSync(file).toString('base64') } }] }] };
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { const j = await r.json(); return (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim(); }
    await new Promise((s) => setTimeout(s, 6000));
  }
  return '(başarısız)';
}
const norm = (s) => s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
let kotu = 0;
for (const f of files) {
  const p = judge ? 'Bu seslendirme klibini dinle. 1) Söylenenleri birebir yaz. 2) Konuşmacının cinsiyeti, telaffuz doğallığı (10 üzerinden), enerji düzeyi (10 üzerinden), reklam filmi anlatıcısı olarak uygunluğu (10 üzerinden) hakkında iki cümle yaz.' : 'Bu ses kaydında söylenenleri birebir, hiçbir şey eklemeden ve düzeltmeden yaz.';
  const out = await transcribe(f, p); const c = N.clips.find((x) => x.id === path.basename(f, '.wav'));
  const ayni = c && !judge ? norm(out) === norm(c.t) : null; if (ayni === false) kotu++;
  console.log('==', path.basename(f), ayni === null ? '' : ayni ? 'AYNI' : 'FARKLI', '\n' + out + (ayni === false ? '\n  beklenen: ' + c.t : ''));
}
if (kotu) { console.log(kotu + ' klip metinden farklı (sayıların rakamla yazılması gibi farklar zararsızdır; kelime farkı varsa klibi yeniden üret)'); process.exitCode = 1; }
