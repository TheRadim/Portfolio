import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';
import { createLocalApp } from '../local.mjs';
import { passwordHash, validateStory } from '../core.mjs';

test('validation rejects impossible dates and oversized or unsupported files', () => {
  const body = { title:'A story',date:'2026-02-28',text:'Hello',files:[{type:'image/jpeg',size:20}] };
  assert.equal(validateStory(body).date,body.date);
  for (const date of ['2026-02-30','bad','2026-13-01']) assert.throws(() => validateStory({...body,date}));
  assert.throws(() => validateStory({...body,files:[{type:'text/html',size:30}]}));
  assert.throws(() => validateStory({...body,files:[{type:'image/jpeg',size:101*1024**2}]}));
});

test('password, uploads, processing, ordering, persistence and deletion', async () => {
  const root = await mkdtemp(join(tmpdir(),'stories-test-'));
  const service = createLocalApp({root,origin:'http://localhost',hash:passwordHash('test-password')});
  const server = service.app.listen(0,'127.0.0.1'); await new Promise(r => server.once('listening',r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let token;
  const request = (path,method='GET',body,headers={}) => fetch(base+'/api'+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
  try {
    assert.equal((await request('/uploads','POST',{})).status,401);
    assert.equal((await request('/login','POST',{password:'test-password'},{Origin:'https://evil.example'})).status,403);
    token = (await (await request('/login','POST',{password:'test-password'})).json()).token;
    assert.equal(token.length,43);
    const photo = await sharp({create:{width:900,height:600,channels:3,background:'#ccddee'}}).png().toBuffer();
    const png = join(root,'fixture.png'); await writeFile(png,photo);
    const clip = join(root,'fixture.mp4');
    const result = spawnSync(ffmpeg,['-y','-loop','1','-i',png,'-t','0.3','-c:v','libx264','-pix_fmt','yuv420p',clip]); assert.equal(result.status,0);
    const video = await readFile(clip);
    const response = await request('/uploads','POST',{title:'Test <script> story',date:'2026-09-29',text:'First paragraph.\n\nSecond paragraph.',files:[{name:'photo.png',size:photo.length,type:'image/png'},{name:'clip.mp4',size:video.length,type:'video/mp4'}]});
    assert.equal(response.status,201); const job = await response.json();
    assert.equal((await request('/uploads','POST',{title:'Duplicate',date:'2026-09-29',text:'',files:[{name:'photo.png',size:photo.length,type:'image/png'}]})).status,409);
    assert.equal((await request(`/uploads/${job.id}/publish`,'POST')).status,400);
    for (let i=0;i<2;i++) assert.equal((await fetch(job.uploads[i].replace('http://localhost',base),{method:'PUT',body:i===0?photo:video})).status,200);
    assert.equal((await request(`/uploads/${job.id}/publish`,'POST')).status,202);
    await service.idle();
    const status = await (await request(`/uploads/${job.id}`)).json(); assert.equal(status.status,'published',JSON.stringify(status));
    const {stories} = await (await request('/stories')).json(); assert.equal(stories.length,1);
    assert.deepEqual(stories[0].media.map(m=>m.type),['image','video']);
    assert.equal('sessionId' in stories[0],false); assert.equal('files' in stories[0],false);
    const metadata = await sharp(join(root,stories[0].media[0].src)).metadata(); assert.equal(metadata.format,'webp'); assert.equal(metadata.width,900); assert.equal(metadata.exif,undefined);
    const thumbnail = await sharp(join(root,stories[0].media[0].thumb)).metadata(); assert.equal(thumbnail.width,250);
    const editable = await (await request(`/stories/${job.id}`)).json();
    const edit = {title:'Renamed story',date:'2026-01-10',text:'Updated words',mediaOrder:[1,0],revision:editable.revision};
    assert.equal((await fetch(base+`/api/stories/${job.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(edit)})).status,401);
    for (const mediaOrder of [[0,0],[0],[0,2],['0',1]]) assert.equal((await request(`/stories/${job.id}`,'PATCH',{...edit,mediaOrder})).status,400);
    assert.equal((await request(`/stories/${job.id}`,'PATCH',edit)).status,200);
    const updated = await (await request(`/stories/${job.id}`)).json();
    assert.equal(updated.title,edit.title); assert.equal(updated.date,edit.date); assert.equal(updated.text,edit.text);
    assert.deepEqual(updated.media.map(m=>m.src),[stories[0].media[1].src,stories[0].media[0].src]);
    assert.equal((await request(`/stories/${job.id}`,'PATCH',edit)).status,409);
    const otherID = '12345678-1234-1234-1234-123456789012';
    await service.repo.set('stories',otherID,{...stories[0],id:otherID,date:'2026-02-01',createdAt:1});
    assert.deepEqual((await (await request('/stories')).json()).stories.map(s=>s.date),['2026-01-10','2026-02-01']);
    await service.repo.remove('stories',otherID);
    assert.equal((await request(`/uploads/${job.id}/publish`,'POST')).status,409);
    const restart = createLocalApp({root,origin:'http://localhost',hash:passwordHash('test-password')}); assert.equal((await restart.repo.list('stories')).length,1);
    assert.equal((await request(`/stories/${job.id}`,'DELETE')).status,200);
    assert.equal((await (await request('/stories')).json()).stories.length,0);
    assert.equal((await fetch(base+stories[0].media[0].src)).status,404);
    await request('/logout','POST'); assert.equal((await request('/uploads','POST',{})).status,401);
    token = undefined;
    for(let i=0;i<10;i++) assert.equal((await request('/login','POST',{password:'wrong'})).status,401);
    const blocked = await request('/login','POST',{password:'test-password'}); assert.equal(blocked.status,429); assert.ok(Number(blocked.headers.get('retry-after'))>0);
  } finally { await new Promise(r=>server.close(r)); await rm(root,{recursive:true,force:true}); }
});

test('bad image never publishes partial content and releases upload lock', async () => {
  const root = await mkdtemp(join(tmpdir(),'stories-bad-'));
  const service = createLocalApp({root,origin:'http://localhost',hash:passwordHash('test')});
  try {
    const id = '12345678-1234-1234-1234-123456789012';
    await service.repo.set('jobs',id,{id,title:'Invalid',date:'2026-09-29',text:'',files:[{index:0,type:'image/jpeg',size:3}],status:'queued',sessionId:'test',completed:0});
    const {mkdir} = await import('node:fs/promises'); await mkdir(join(root,'incoming',id),{recursive:true}); await writeFile(join(root,'incoming',id,'0'),'bad');
    const {processJob} = await import('../core.mjs'); await processJob(id,service);
    assert.equal((await service.repo.get('jobs',id)).status,'failed'); assert.equal((await service.repo.list('stories')).length,0);
  } finally {await rm(root,{recursive:true,force:true});}
});
