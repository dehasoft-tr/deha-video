// Tek komutla yeniden seslendirme: sentez -> işleme -> render -> ses karışımı.
//   node tools/revoice.mjs [--voice <ses>] [--model <model>] [--tempo 1.0] [--workers 4] [--no-render]
import { execFileSync } from 'node:child_process'; import path from 'node:path'; import { root, arg, has } from './cfg.mjs';
const run = (f, a = []) => execFileSync(process.execPath, [path.join(root, 'tools', f), ...a], { stdio: 'inherit', cwd: root });
const a = ['--force']; for (const k of ['voice', 'model', 'key-file']) if (arg(k)) a.push('--' + k, arg(k));
run('tts.mjs', a); run('build-vo.mjs', ['--tempo', arg('tempo', '1.0')]);
if (!has('no-render')) { run('render.mjs', ['--workers', arg('workers', '4')]); run('mix.mjs'); }
