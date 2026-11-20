// Belirtilen anların (sn) karesini PNG olarak alır:  node tools/still.mjs out/stills 3.0 10.5 ...   ya da   node tools/still.mjs out/stills --beats
import { chromium } from 'playwright-core'; import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
import { launchOpts } from './browser.mjs'; import { root, cfg } from './cfg.mjs';
const [dir, ...rest] = process.argv.slice(2); fs.mkdirSync(path.resolve(root, dir), { recursive: true });
const b = await chromium.launch(launchOpts()); const p = await b.newPage({ viewport: { width: cfg.width, height: cfg.height } });
p.on('pageerror', (e) => console.log('pageerror', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
await p.goto(pathToFileURL(path.join(root, 'index.html')).href + '?render=1'); await p.evaluate(() => window.READY);
let times = rest.map(Number);
if (rest[0] === '--beats') { const bt = await p.evaluate(() => window.FILM.beats); times = bt.flatMap((x) => [x[1] + 0.9, (x[1] + x[2]) / 2, x[2] - 0.35]); }
for (const t of times) { await p.evaluate((s) => window.seek(s), t); await p.screenshot({ path: path.resolve(root, dir, `t${t.toFixed(2).padStart(6, '0')}.png`) }); console.log(t.toFixed(2)); }
await b.close();
