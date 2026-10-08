import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const ts = require('typescript');
const source = fs.readFileSync(new URL('../apps/web/src/lib/events/event-video-metadata.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replace('"mediainfo.js"', JSON.stringify(pathToFileURL(require.resolve('mediainfo.js').replace('/cjs/index.cjs', '/esm/index.js')).href))
  .replace('"./event-images"', JSON.stringify(new URL('../apps/web/src/lib/events/event-images.ts', import.meta.url).href));
const moduleSource = `import {createRequire} from 'node:module'; const require = createRequire(${JSON.stringify(new URL('../apps/web/package.json', import.meta.url).href)});\n${compiled}`;
const { getStoredEventVideoError: validate } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
const fixture = name => new Blob([fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url))]);

test('actual MP4 duration: accepts exactly 59s and rejects 60s', async () => {
  assert.equal(await validate(fixture('video-59s.mp4')), null);
  assert.match(await validate(fixture('video-60s.mp4')), /59 segundos/);
});
test('actual MOV and WebM metadata are accepted', async () => {
  assert.equal(await validate(fixture('video-2s.mov')), null);
  assert.equal(await validate(fixture('video-2s.webm')), null);
});
test('renamed text or an empty file is not a valid video', async () => {
  assert.match(await validate(new Blob(['<html>not a video</html>'], { type: 'video/mp4' })), /vídeo válido/);
  assert.match(await validate(new Blob([])), /vídeo válido/);
});
