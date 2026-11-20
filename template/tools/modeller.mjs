// Anahtarın eriştiği Gemini seslendirme modellerini listeler (kota harcamaz):  node tools/modeller.mjs
import { readKey } from './cfg.mjs';
const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': readKey() } });
const j = await r.json(); if (j.error) { console.error('HATA', j.error.status, j.error.message); process.exit(1); }
for (const m of j.models) if (/tts/.test(m.name)) console.log(m.name.replace('models/', ''));
