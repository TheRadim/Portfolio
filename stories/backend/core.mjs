import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import express from 'express';
import sharp from 'sharp';
import bundledFFmpeg from 'ffmpeg-static';

export const limits = { files: 20, fileBytes: 100 * 1024 ** 2, totalBytes: 500 * 1024 ** 2 };
const types = new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm']);
const validID = (id) => /^[a-f0-9-]{36}$/.test(id);
const digest = (value) => createHash('sha256').update(value).digest('hex');
export const passwordHash = (password, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const verifyPassword = (password, hash) => { const [salt, expected] = hash.split(':'); if (!salt || !/^[a-f0-9]{128}$/.test(expected || '')) return false; return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(expected, 'hex')); };
export class PublicError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
export function validateDetails(body) {
  if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120) throw new PublicError('Give your story a name, up to 120 characters.');
  if (typeof body.text !== 'string' || body.text.length > 5000) throw new PublicError('Keep the story text under 5,000 characters.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || '') || !Number.isFinite(Date.parse(body.date)) || new Date(body.date).toISOString().slice(0,10) !== body.date) throw new PublicError('Choose a valid date.');
  return { title: body.title.trim(), date: body.date, text: body.text.trim() };
}
export function validateStory(body) {
  const details = validateDetails(body);
  if (!Array.isArray(body.files) || !body.files.length || body.files.length > limits.files) throw new PublicError('Choose between 1 and 20 photos or videos.');
  if (body.files.some((f) => !types.has(f.type) || !Number.isSafeInteger(f.size) || f.size <= 0 || f.size > limits.fileBytes)) throw new PublicError('Use JPG, PNG, WebP, HEIC, MP4, MOV or WebM files, up to 100 MB each.');
  if (body.files.reduce((sum, f) => sum + f.size, 0) > limits.totalBytes) throw new PublicError('Keep the total upload under 500 MB.');
  return { ...details, files: body.files.map((f, index) => ({ index, size: f.size, type: f.type })) };
}
function validateMediaOrder(order, existingCount, newCount = 0) {
  if (!Array.isArray(order) || !order.length || order.length > limits.files || new Set(order).size !== order.length) throw new PublicError('Keep between 1 and 20 photos or videos, without duplicates.');
  for (const item of order) {
    if (Number.isInteger(item) && item >= 0 && item < existingCount) continue;
    if (typeof item === 'string' && /^new:\d+$/.test(item) && Number(item.slice(4)) < newCount) continue;
    throw new PublicError('The photo order is invalid. Open the story again.');
  }
  for (let i = 0; i < newCount; i++) if (!order.includes(`new:${i}`)) throw new PublicError('Include each new photo or video in the order.');
  return order;
}
async function removeUnused(media, items) {
  if (!items.length) return;
  try { await media.removeItems(items); } catch (error) { console.error('Unused story media cleanup failed:', error.message); }
}
export function createAPI({ repo, media, getPasswordHash, originList, queue, trustProxy = false }) {
  const app = express(); app.disable('x-powered-by'); app.set('trust proxy', trustProxy);
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store'); res.set('X-Content-Type-Options', 'nosniff');
    const origin = req.get('Origin');
    if (origin && !originList.includes(origin)) return res.status(403).json({ error: 'This origin is not allowed.' });
    if (origin) { res.set('Access-Control-Allow-Origin', origin); res.vary('Origin'); }
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.post('/login', async (req, res) => {
    const password = req.body?.password;
    if (typeof password !== 'string' || password.length > 256) throw new PublicError('Enter your password.');
    const ip = digest(req.ip || 'unknown'), now = Date.now();
    const rate = await repo.mutate('attempts', ip, (old) => {
      const item = old && old.until > now ? old : { count: 0, until: now + 120000 };
      return { ...item, count: Math.min(item.count + 1, 11) };
    });
    if (rate.count > 10) { res.set('Retry-After', String(Math.ceil((rate.until - now) / 1000))); throw new PublicError('Too many attempts. Please wait two minutes and try again.', 429); }
    if (!verifyPassword(password, getPasswordHash())) throw new PublicError('That password isn’t right. Try again.', 401);
    await repo.remove('attempts', ip);
    const token = randomBytes(32).toString('base64url');
    await repo.set('sessions', digest(token), { expiresAt: now + 12 * 60 * 60 * 1000 });
    res.json({ token });
  });
  async function authenticate(req, _res, next) {
    const token = req.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (!token) throw new PublicError('Please unlock your diary again.', 401);
    req.sessionId = digest(token); const session = await repo.get('sessions', req.sessionId);
    if (!session || session.expiresAt < Date.now()) throw new PublicError('Please unlock your diary again.', 401);
    next();
  }
  app.post('/logout', authenticate, async (req, res) => { await repo.remove('sessions', req.sessionId); res.json({ ok: true }); });
  app.get('/stories', async (_req, res) => {
    const stories = (await repo.list('stories')).sort((a,b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    // Expose only visitor content, never upload metadata or credentials.
    res.json({ stories: stories.map(({ id, title, date, text, media }) => ({ id, title, date, text, media })) });
  });
  app.get('/stories/:id', authenticate, async (req, res) => {
    if (!validID(req.params.id)) throw new PublicError('Story not found.', 404);
    const story = await repo.get('stories', req.params.id);
    if (!story) throw new PublicError('Story not found.', 404);
    const { id, title, date, text, media, createdAt, updatedAt } = story;
    res.json({ id, title, date, text, media, revision: updatedAt || createdAt });
  });
  app.patch('/stories/:id', authenticate, async (req, res) => {
    if (!validID(req.params.id)) throw new PublicError('Story not found.', 404);
    const details = validateDetails(req.body), order = req.body.mediaOrder;
    let removed = [];
    const story = await repo.mutate('stories', req.params.id, (old) => {
      if (!old) throw new PublicError('Story not found.', 404);
      if (req.body.revision !== (old.updatedAt || old.createdAt)) throw new PublicError('This story has changed. Open it again before saving.', 409);
      validateMediaOrder(order, old.media.length);
      removed = old.media.filter((_, i) => !order.includes(i));
      return { ...old, ...details, media: order.map(i => old.media[i]), updatedAt: Math.max(Date.now(), (old.updatedAt || old.createdAt) + 1) };
    });
    await removeUnused(media, removed);
    res.json({ ok: true, revision: story.updatedAt });
  });
  app.post('/uploads', authenticate, async (req, res) => {
    const input = validateStory(req.body), id = randomUUID(), now = Date.now();
    let edit = {};
    if (req.body.storyId !== undefined) {
      if (!validID(req.body.storyId)) throw new PublicError('Story not found.', 404);
      const old = await repo.get('stories', req.body.storyId);
      if (!old) throw new PublicError('Story not found.', 404);
      if (req.body.revision !== (old.updatedAt || old.createdAt)) throw new PublicError('This story has changed. Open it again before saving.', 409);
      validateMediaOrder(req.body.mediaOrder, old.media.length, input.files.length);
      edit = { storyId: old.id, revision: req.body.revision, mediaOrder: req.body.mediaOrder };
    }
    // One outstanding upload per session prevents accidental duplicate clicks and resource bursts.
    const lock = await repo.mutate('uploadLocks', req.sessionId, (old) => old && old.until > now ? old : { id, until: now + 30 * 60 * 1000 });
    if (lock.id !== id) throw new PublicError('An upload is already in progress. Wait for it to finish, or lock and unlock the diary to start again.', 409);
    try {
      const job = { id, ...input, ...edit, status: 'uploading', createdAt: now, sessionId: req.sessionId, completed: 0 };
      await repo.set('jobs', id, job);
      const uploads = [];
      for (const file of input.files) uploads.push(await media.uploadURL(id, file, req.get('Origin')));
      res.status(201).json({ id, uploads });
    } catch (error) { await repo.remove('uploadLocks', req.sessionId); throw error; }
  });
  async function getJob(req) {
    if (!validID(req.params.id)) throw new PublicError('Story not found.', 404);
    const job = await repo.get('jobs', req.params.id);
    if (!job || job.sessionId !== req.sessionId) throw new PublicError('Story not found.', 404);
    return job;
  }
  app.post('/uploads/:id/publish', authenticate, async (req, res) => {
    const job = await getJob(req);
    if (job.status !== 'uploading') throw new PublicError('This story has already been submitted.', 409);
    for (const file of job.files) {
      const size = await media.inputSize(job.id, file.index);
      if (size !== file.size || size > limits.fileBytes) throw new PublicError('An upload is incomplete or too large. Please upload the story again.');
    }
    await repo.mutate('jobs', job.id, (old) => { if (old.status !== 'uploading') throw new PublicError('This story has already been submitted.', 409); return { ...old, status: 'queued', queuedAt: Date.now() }; });
    if (queue) queue(job.id);
    res.status(202).json({ status: 'queued' });
  });
  app.get('/uploads/:id', authenticate, async (req, res) => {
    const job = await getJob(req);
    if (['queued','processing'].includes(job.status) && Date.now() - job.queuedAt > 16 * 60 * 1000) {
      throw new PublicError('Processing is taking too long. Check your diary before trying again.', 503);
    }
    res.json({ status: job.status, completed: job.completed, error: job.error });
  });
  app.delete('/uploads/:id', authenticate, async (req, res) => {
    const job = await getJob(req);
    if (!['uploading','failed'].includes(job.status)) throw new PublicError('This story is already processing. Check the diary before uploading again.', 409);
    await media.removeInputs(job.id);
    await repo.remove('jobs', job.id);
    await repo.remove('uploadLocks', req.sessionId);
    res.json({ ok: true });
  });
  app.delete('/stories/:id', authenticate, async (req, res) => {
    if (!validID(req.params.id)) throw new PublicError('Story not found.', 404);
    const story = await repo.get('stories', req.params.id);
    if (!story) throw new PublicError('Story not found.', 404);
    // Deletion remains retryable if storage fails. Report success only after files and record are gone.
    await media.removePublished(story.id);
    await repo.remove('stories', story.id);
    await repo.remove('jobs', story.id);
    res.json({ ok: true });
  });
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error('Stories request failed:', err.message);
    res.status(status).json({ error: err instanceof PublicError ? err.message : status === 413 ? 'This request is too large.' : 'The diary service couldn’t complete that request. Please try again.' });
  });
  return app;
}
function command(args, timeout = 180000) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.FFMPEG_PATH || bundledFFmpeg, args, { stdio: ['ignore','ignore','pipe'] });
    let stderr = ''; child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-16000); });
    const timer = setTimeout(() => child.kill('SIGKILL'), timeout);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, stderr }); });
  });
}
export async function processJob(id, { repo, media }) {
  let claimed = false;
  const job = await repo.mutate('jobs', id, (old) => {
    claimed = false;
    if (!old || old.status !== 'queued') return old;
    claimed = true; return { ...old, status: 'processing', startedAt: Date.now() };
  });
  if (!claimed) return;
  const temp = await mkdtemp(join(tmpdir(), 'radim-story-')), started = Date.now(), results = [], uploaded = [];
  const targetID = job.storyId || id, prefix = job.storyId ? `${id}-` : '';
  let committed = false;
  try {
    for (const file of job.files) {
      if (Date.now() - started > 380000) throw new PublicError('This story is too large to process in one go. Please try fewer videos.');
      const input = join(temp, 'input'), full = join(temp, 'full.webp'), thumb = join(temp, 'thumb.webp');
      await media.download(id, file.index, input);
      let src, type = file.type.startsWith('video/') ? 'video' : 'image';
      if (type === 'image') {
        try {
          await sharp(input, { limitInputPixels: 80000000 }).rotate().resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 75 }).toFile(full);
          await sharp(input, { limitInputPixels: 80000000 }).rotate().resize({ width: 250, withoutEnlargement: true }).webp({ quality: 75 }).toFile(thumb);
        } catch { throw new PublicError('One photo could not be read. Try exporting it as a JPG and uploading again.'); }
        src = await media.publish(full, targetID, `${prefix}${file.index}.webp`, 'image/webp');
      } else {
        const probe = await command(['-nostdin','-protocol_whitelist','file,pipe','-i',input], 15000);
        const duration = probe.stderr.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
        if (!duration || Number(duration[1])*3600 + Number(duration[2])*60 + Number(duration[3]) > 180) throw new PublicError('Use videos up to 3 minutes long, in MP4, MOV or WebM format.');
        const video = join(temp, 'video.mp4'), poster = join(temp, 'poster.jpg');
        const result = await command(['-nostdin','-y','-protocol_whitelist','file,pipe','-i',input,'-map','0:v:0','-vf','scale=-2:trunc(min(720\\,ih)/2)*2,fps=24','-c:v','libx264','-threads','2','-preset','medium','-crf','30','-pix_fmt','yuv420p','-an','-movflags','+faststart',video], Math.min(240000, 460000 - (Date.now() - started)));
        if (result.code !== 0) throw new PublicError('One video could not be compressed. Try a shorter MP4 clip.');
        const posterResult = await command(['-nostdin','-y','-i',video,'-frames:v','1',poster], 15000);
        if (posterResult.code !== 0) throw new PublicError('The video preview could not be created.');
        await sharp(poster).resize({ width: 250 }).webp({ quality: 75 }).toFile(thumb);
        src = await media.publish(video, targetID, `${prefix}${file.index}.mp4`, 'video/mp4');
        await rm(video, { force: true }); await rm(poster, { force: true });
      }
      uploaded.push({ src });
      const thumbnail = await media.publish(thumb, targetID, `${prefix}${file.index}-thumb.webp`, 'image/webp');
      uploaded.push({ src: thumbnail });
      results.push({ type, src, thumb: thumbnail });
      await repo.mutate('jobs', id, (old) => ({ ...old, completed: results.length }));
      await rm(input, { force: true }); await rm(full, { force: true }); await rm(thumb, { force: true });
    }
    let removed = [];
    if (job.storyId) {
      await repo.mutate('stories', targetID, old => {
        if (!old) throw new PublicError('This story was deleted while the upload was processing.');
        if ((old.updatedAt || old.createdAt) !== job.revision) throw new PublicError('This story changed while uploading. Open it again to apply your changes.');
        validateMediaOrder(job.mediaOrder, old.media.length, results.length);
        removed = old.media.filter((_, i) => !job.mediaOrder.includes(i));
        return { ...old, title: job.title, date: job.date, text: job.text, media: job.mediaOrder.map(i => typeof i === 'number' ? old.media[i] : results[Number(i.slice(4))]), updatedAt: Math.max(Date.now(), job.revision + 1) };
      });
    } else {
      await repo.set('stories', id, { id, title: job.title, date: job.date, text: job.text, createdAt: job.createdAt, media: results });
    }
    committed = true;
    await removeUnused(media, removed);
    await repo.mutate('jobs', id, (old) => ({ ...old, status: 'published', finishedAt: Date.now() }));
  } catch (error) {
    console.error('Story processing failed:', id, error.message);
    if (committed) {
      await repo.mutate('jobs', id, old => ({ ...old, status: 'published', finishedAt: Date.now() }));
    } else {
      if (job.storyId) await removeUnused(media, uploaded);
      else { await repo.remove('stories', id).catch(() => {}); await media.removePublished(id).catch(() => {}); }
      await repo.mutate('jobs', id, (old) => ({ ...old, status: 'failed', error: error instanceof PublicError ? error.message : 'This story could not be prepared. Please try again.', finishedAt: Date.now() }));
    }
  } finally {
    await media.removeInputs(id).catch(() => {});
    await repo.remove('uploadLocks', job.sessionId);
    await rm(temp, { recursive: true, force: true });
  }
}
