import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync, createWriteStream } from 'node:fs';
import { copyFile, stat, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import express from 'express';
import { createAPI, processJob } from './core.mjs';
export function localServices(root, origin) {
  mkdirSync(root, { recursive: true }); const dbFile = join(root, 'db.json');
  const db = existsSync(dbFile) ? JSON.parse(readFileSync(dbFile,'utf8')) : {};
  const persist = () => { writeFileSync(dbFile + '.tmp', JSON.stringify(db)); renameSync(dbFile + '.tmp',dbFile); };
  const repo = {
    async get(c,id) { return structuredClone(db[c]?.[id] || null); },
    async set(c,id,data) { (db[c] ||= {})[id] = structuredClone(data); persist(); },
    async remove(c,id) { if (db[c]) delete db[c][id]; persist(); },
    async list(c) { return structuredClone(Object.values(db[c] || {})); },
    async mutate(c,id,fn) { const data = fn(structuredClone(db[c]?.[id] || null)); if (data) { (db[c] ||= {})[id] = structuredClone(data); persist(); } return data; }
  };
  const tickets = new Map(), media = {
    async uploadURL(id,file) { const ticket = randomBytes(24).toString('hex'); tickets.set(ticket,{id,file}); return `${origin}/local-upload/${ticket}`; },
    async inputSize(id,index) { try { return (await stat(join(root,'incoming',id,String(index)))).size; } catch { return 0; } },
    async download(id,index,path) { await copyFile(join(root,'incoming',id,String(index)),path); },
    async publish(path,id,name) { const dir = join(root,'media',id); mkdirSync(dir,{recursive:true}); await copyFile(path,join(dir,name)); return `/media/${id}/${name}`; },
    async removeItems(items) {
      for (const path of new Set(items.flatMap(item => [item.src,item.thumb]).filter(Boolean))) {
        const target = resolve(root, '.' + path);
        if (!target.startsWith(resolve(root,'media') + '/')) throw new Error('Unexpected media path');
        await rm(target,{force:true});
      }
    },
    async removeInputs(id) { await rm(join(root,'incoming',id),{recursive:true,force:true}); },
    async removePublished(id) { await rm(join(root,'media',id),{recursive:true,force:true}); }
  };
  return { repo, media, tickets, root };
}
export function createLocalApp({ root, origin, hash, webRoot }) {
  const services = localServices(root,origin), app = express(); let chain = Promise.resolve();
  const queue = (id) => { chain = chain.then(() => processJob(id,services)).catch(console.error); };
  app.put('/local-upload/:ticket', async (req,res) => {
    const ticket = services.tickets.get(req.params.ticket); if (!ticket) return res.sendStatus(403);
    services.tickets.delete(req.params.ticket); const dir = join(root,'incoming',ticket.id); mkdirSync(dir,{recursive:true}); let count = 0;
    try { await pipeline(req,new Transform({ transform(chunk,_encoding,cb) { count += chunk.length; cb(count > ticket.file.size ? new Error('Too large') : null,chunk); } }),createWriteStream(join(dir,String(ticket.file.index)))); res.sendStatus(200); }
    catch { if (!res.headersSent) res.sendStatus(400); }
  });
  app.use('/api',createAPI({ ...services, getPasswordHash: () => hash, originList: [origin], queue }));
  app.use('/media',express.static(join(root,'media')));
  if (webRoot) {
    for (const file of ['index.html','stories.html','add-content.html','delete-content.html','styles.css','script.js','favicon.ico']) app.get(file === 'index.html' ? ['/', '/index.html'] : `/${file}`, (_req,res) => res.sendFile(resolve(webRoot,file)));
    app.use('/assets',express.static(join(webRoot,'assets')));
    for (const file of ['stories.css','stories.js','navigation.mjs','config.js','admin.css','admin.js']) app.get(`/stories/${file}`,(_req,res) => res.sendFile(resolve(webRoot,'stories',file)));
  }
  return { app, ...services, idle: () => chain };
}
