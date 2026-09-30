import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'node:crypto';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { createAPI, processJob } from './core.mjs';
initializeApp();
const db = getFirestore();
const secret = defineSecret('STORIES_PASSWORD_HASH');
const bucketName = defineString('STORIES_BUCKET');
const region = 'europe-west1';
const origins = ['https://radim-theiner.com','https://www.radim-theiner.com'];
function expiry(collection, data) {
  if (collection === 'sessions') return { ...data, expireAt: Timestamp.fromMillis(data.expiresAt) };
  if (collection === 'attempts') return { ...data, expireAt: Timestamp.fromMillis(data.until + 86400000) };
  return data;
}
export const repo = {
  async get(c,id) { const doc = await db.collection(c).doc(id).get(); return doc.exists ? doc.data() : null; },
  async set(c,id,data) { await db.collection(c).doc(id).set(expiry(c,data)); },
  async remove(c,id) { await db.collection(c).doc(id).delete(); },
  async list(c) { return (await db.collection(c).get()).docs.map((d) => d.data()); },
  async mutate(c,id,fn) { return db.runTransaction(async (tx) => { const ref = db.collection(c).doc(id), snap = await tx.get(ref); const data = fn(snap.exists ? snap.data() : null); if (data) tx.set(ref, expiry(c,data)); return data; }); }
};
const bucket = () => getStorage().bucket(bucketName.value());
export const media = {
  async uploadURL(id,file,origin) {
    const [url] = await bucket().file(`incoming/${id}/${file.index}`).createResumableUpload({ origin, metadata: { contentType: file.type, cacheControl: 'no-store' } });
    return url;
  },
  async inputSize(id,index) { try { const [metadata] = await bucket().file(`incoming/${id}/${index}`).getMetadata(); return Number(metadata.size); } catch { return 0; } },
  async download(id,index,path) { await bucket().file(`incoming/${id}/${index}`).download({ destination: path, validation: 'crc32c' }); },
  async publish(path,id,name,type) {
    const token = randomUUID(), destination = `media/${id}/${name}`;
    await bucket().upload(path, { destination, resumable: false, metadata: { contentType: type, cacheControl: 'public,max-age=86400', metadata: { firebaseStorageDownloadTokens: token } } });
    return `https://firebasestorage.googleapis.com/v0/b/${bucket().name}/o/${encodeURIComponent(destination)}?alt=media&token=${token}`;
  },
  async removeInputs(id) { await bucket().deleteFiles({ prefix: `incoming/${id}/` }); },
  async removePublished(id) { await bucket().deleteFiles({ prefix: `media/${id}/` }); }
};
const apiApp = createAPI({ repo, media, getPasswordHash: () => secret.value(), originList: origins, trustProxy: 1 });
export const storiesApi = onRequest({ region, secrets: [secret], memory: '256MiB', timeoutSeconds: 60, maxInstances: 3, cors: false }, apiApp);
export const compressStory = onDocumentUpdated({ document: 'jobs/{id}', region, memory: '2GiB', cpu: 1, concurrency: 1, maxInstances: 1, timeoutSeconds: 540, retry: false }, async (event) => {
  if (event.data.after.data().status === 'queued' && event.data.before.data().status !== 'queued') await processJob(event.params.id, { repo, media });
});
