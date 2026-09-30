import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createLocalApp } from './local.mjs';
const here = dirname(fileURLToPath(import.meta.url)), port = Number(process.env.PORT || 8787), origin = `http://localhost:${port}`;
if (!process.env.STORIES_PASSWORD_HASH) throw new Error('Set STORIES_PASSWORD_HASH in the ignored .env file before starting.');
const { app } = createLocalApp({ root: resolve(here,'local-data'), origin, hash: process.env.STORIES_PASSWORD_HASH, webRoot: resolve(here,'../..') });
app.listen(port,'127.0.0.1',() => console.log(`Stories preview: ${origin}/stories.html`));
