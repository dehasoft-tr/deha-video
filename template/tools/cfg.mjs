// Ortak ayarlar: film boyutu (film.config.json), ffmpeg yolları, API anahtarı dosyası.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const cfg = Object.assign({ width: 1080, height: 1920, fps: 30 }, JSON.parse(fs.readFileSync(path.join(root, 'film.config.json'), 'utf8')));
const bul = (ad) => ['/opt/homebrew/bin/' + ad, '/usr/local/bin/' + ad].find((p) => fs.existsSync(p)) || ad;
export const FF = process.env.FFMPEG || bul('ffmpeg');
export const FP = process.env.FFPROBE || bul('ffprobe');
export const arg = (k, d = null) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
export const has = (k) => process.argv.includes('--' + k);
// Anahtar: --key-file > DEHA_VIDEO_KEY_FILE > ~/.config/deha-video/gemini.key. Asla yazdırılmaz, projeye kopyalanmaz.
export function readKey() {
  const f = arg('key-file') || process.env.DEHA_VIDEO_KEY_FILE || path.join(os.homedir(), '.config/deha-video/gemini.key');
  if (!fs.existsSync(f)) { console.error('API anahtarı dosyası yok: ' + f + '  (skill içindeki scripts/anahtar.sh kaydet ile kur)'); process.exit(3); }
  return fs.readFileSync(f, 'utf8').trim();
}
export const narration = () => JSON.parse(fs.readFileSync(path.join(root, 'tools/narration.json'), 'utf8'));
