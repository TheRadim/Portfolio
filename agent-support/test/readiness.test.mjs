import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { handle, negotiate } from '../worker.mjs';
const read = p => readFile(new URL('../../'+p, import.meta.url), 'utf8');
const home = await read('index.html');
const files = Object.fromEntries(await Promise.all(['index.md','404.md','stories.md','llms.txt'].map(async p=>['/'+p,await read(p)])));
const origin = async request => {
  const path = new URL(request.url).pathname;
  if (files[path]) return new Response(files[path]);
  return new Response(request.method === 'HEAD' ? null : path === '/asset.png' ? 'binary' : home, {status:['/','/index.html','/stories.html','/asset.png'].includes(path)?200:404,headers:{'Content-Type':path==='/asset.png'?'image/png':'text/html','Vary':'Accept-Encoding','ETag':'html-tag'}});
};
const get = (path, accept, method='GET') => handle(new Request('https://radim-theiner.com'+path,{method,headers:{Accept:accept}}),origin);
test('Accept preferences, wildcards, explicit exclusions and unsupported types',()=>{
  for(const [header,expected] of [['text/markdown','markdown'],['text/html','html'],['*/*','html'],['text/markdown;q=0,*/*;q=1','html'],['text/html;q=0.3,text/markdown;q=0.8','markdown'],['text/markdown;q=0.2,text/html;q=0.9','html'],['application/json',null],['text/*;q=0,*/*;q=1',null],['text/html;q=0,text/markdown;q=0',null]]) assert.equal(negotiate(header),expected,header);
});
test('homepage and story negotiation returns Markdown, preserves HTML, varies caches',async()=>{
  for(const path of ['/','/index.html','/stories.html'])for(const accept of ['text/markdown','text/html']){
    const r=await get(path,accept);assert.equal(r.status,200);assert.match(r.headers.get('vary'),/Accept-Encoding, Accept/);assert.match(r.headers.get('content-type'),new RegExp(accept));assert.ok((await r.text()).startsWith(accept==='text/html'?'<!DOCTYPE html>':'# '));
  }
});
test('missing paths preserve 404 and supply useful Markdown recovery links',async()=>{
  for(const accept of ['text/markdown','text/html']){const r=await get('/missing-probe',accept);assert.equal(r.status,404);assert.match(r.headers.get('content-type'),new RegExp(accept));const body=await r.text();assert.ok(body.length>20);if(accept==='text/markdown')assert.match(body,/\[Agent guidance\]\(https:\/\/radim-theiner.com\/llms.txt\)/);}
});
test('HEAD, 406, asset pass-through and Markdown representation validators',async()=>{
  assert.equal(await(await get('/','text/markdown','HEAD')).text(),'');
  assert.equal((await get('/','application/json')).status,406);
  assert.equal(await(await get('/asset.png','image/png')).text(),'binary');
  assert.equal((await get('/','text/markdown')).headers.get('etag'),null);
});
test('truthful Person identity and machine-readable discovery without visual edits',async()=>{
  const data=JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data['@context'],'https://schema.org');assert.equal(data['@type'],'Person');assert.equal(data.name,'Radim Theiner');assert.match(home,/mailto:hi@radim-theiner.com/);assert.equal(data.contactPoint.email,data.email);assert.ok(data.sameAs.every(url=>home.includes(url)));assert.ok(!data.address);assert.match(home,/rel="alternate" type="text\/markdown" href="\/index.md"/);
  for(const file of ['stories.html','404.html'])assert.match(await read(file),/rel="describedby" href="\/llms.txt"/);
});
test('llms format, use cases, local links and raw Markdown publishing',async()=>{
  const llms=files['/llms.txt'];assert.match(llms,/^# Radim Theiner\n\n> /);assert.match(llms,/## When to use this/);
  for(const section of llms.split(/^## /m).slice(1))for(const line of section.split('\n').slice(1).filter(l=>l.trim()))assert.match(line,/^- \[[^\]]+\]\(https:\/\//);
  for(const text of Object.values(files))for(const match of text.matchAll(/\]\(https:\/\/radim-theiner.com\/([^\s)]*)\)/g)) {const [path,hash]=match[1].split('#');if(path)await read(path);if(hash)assert.ok(home.includes(`id="${hash}"`));}
  assert.match(await read('_config.yml'),/optional_front_matter:\n  enabled: false/);assert.match(await read('_config.yml'),/- agent-support/);
});
test('metadata changes preserve visible HTML exactly', async()=>{
  const {execFileSync}=await import('node:child_process');
  for(const path of ['index.html','stories.html','404.html']){
    const before=execFileSync('git',['show','1d39e6a:'+path],{encoding:'utf8'});
    assert.equal((await read(path)).split('</head>')[1],before.split('</head>')[1]);
  }
});
test('redirects and write requests pass through, missing Markdown fails honestly',async()=>{
  const redirect=await handle(new Request('https://www.radim-theiner.com/',{headers:{Accept:'text/markdown'}}),async()=>new Response(null,{status:301,headers:{Location:'https://radim-theiner.com/'}}));assert.equal(redirect.status,301);
  const post=await handle(new Request('https://radim-theiner.com/',{method:'POST',body:'hello'}),async r=>new Response(await r.text()));assert.equal(await post.text(),'hello');
  let calls=0;const failure=await handle(new Request('https://radim-theiner.com/',{headers:{Accept:'text/markdown'}}),async()=>++calls===1?new Response(home):new Response('missing',{status:404}));assert.equal(failure.status,502);
});
