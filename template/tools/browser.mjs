// Kurulu Playwright Chromium'unu başlıksız açar (macOS'ta GPU: ANGLE/Metal).
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
function chromePath() {
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright'); if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) for (const sub of ['chrome-mac-arm64', 'chrome-mac']) for (const app of ['Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'Chromium.app/Contents/MacOS/Chromium']) { const p = path.join(base, d, sub, app); if (fs.existsSync(p)) return p; }
  return null;
}
export function launchOpts() {
  const exe = process.env.CHROME_PATH || chromePath(); const mac = process.platform === 'darwin';
  const o = { headless: true, args: ['--headless=new', ...(mac ? ['--use-angle=metal'] : []), '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--hide-scrollbars', '--force-color-profile=srgb', '--disable-lcd-text', '--autoplay-policy=no-user-gesture-required'] };
  if (exe) o.executablePath = exe; // yoksa playwright kendi tarayıcısını arar (npx playwright install chromium)
  return o;
}
