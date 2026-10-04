import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import * as media from '../apps/web/src/lib/events/event-images.ts';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const ts = require('typescript');
const source = fs.readFileSync(new URL('../apps/web/src/services/events/event-images.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture({ referenced = [], offline = false } = {}) {
  const removed = [];
  const supabase = {
    from() { return { select() { return { in: async () => ({ data: referenced.map(storage_path => ({ storage_path })), error: offline ? new Error('Offline') : null }) }; } }; },
    storage: { from() { return { remove: async paths => { removed.push(...paths); return { error: null }; } }; } },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, console, require(name) {
    if (name === '@lookup/services') return { supabase };
    if (name === '@/lib/events/event-images') return media;
    throw new Error(name);
  } });
  return { cleanup: exports.removeEventImagesFromStorage, removed };
}
test('cleanup after a lost save response preserves referenced media', async () => {
  const f = fixture({ referenced: ['committed.mp4'] });
  await f.cleanup(['committed.mp4', 'unused.jpg']);
  assert.deepEqual(f.removed, ['unused.jpg']);
});
test('cleanup never guesses which media to delete while the database is unreachable', async () => {
  const f = fixture({ offline: true });
  await f.cleanup(['maybe-committed.mp4']);
  assert.deepEqual(f.removed, []);
});
