import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as media from '../apps/web/src/lib/events/event-images.ts';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync(new URL('../apps/web/src/lib/events/event-video-validation.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(duration, unreadable=false) {
  const released=[];
  const video={duration,removeAttribute(){},load(){},set src(value){queueMicrotask(()=>unreadable?this.onerror():this.onloadedmetadata());}};
  const exports={};
  vm.runInNewContext(compiled,{exports,require:()=>media,document:{createElement:()=>video},window:{setTimeout,clearTimeout},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:value=>released.push(value)}});
  return {validate:exports.validateSelectedEventVideo,released};
}
test('local duration check rejects long videos and always releases the preview',async()=>{
  const f=fixture(60);
  await assert.rejects(f.validate({}),/59 segundos/);
  assert.deepEqual(f.released,['blob:test']);
});
test('59s is accepted; unknown browser metadata is deferred to server validation',async()=>{
  for(const [duration,unreadable] of [[59,false],[Infinity,false],[NaN,true]]) {
    const f=fixture(duration,unreadable);
    await f.validate({});
    assert.deepEqual(f.released,['blob:test']);
  }
});
