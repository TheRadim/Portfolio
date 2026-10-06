# Stories

The portfolio remains a static GitHub Pages site. Only `index.html` and a scoped block in `styles.css` change there. Stories uses separate scripts and styles:

- `/stories.html`: visitor diary, oldest date at the top and newest at the bottom, opening on the latest event; wrapping thumbnail rows, photo swipes, touch-and-drag timeline and wheel navigation. Ordinary reloads start on the newest date; explicit event links open their target.
- `/add-content.html`: password-only upload, metadata and file ordering, compression progress, publication.
- `/delete-content.html`: password-only management list, prefilled editing of title/date/text, media order, and adding/removing media, plus one permanent-delete confirmation.

## Firebase project

Project: `radim-theiner-diary` (Radim Stories). Region: `europe-west1`.

Blaze billing is enabled under the personal Gmail account. Firestore and the Firebase Storage bucket are provisioned in `europe-west1`. The bucket is `radim-theiner-diary.firebasestorage.app`. Usage and cost depend on stored media, downloads, and processing time. Budget alerts are notifications, not a spending cap.

Architecture:

1. `storiesApi` checks a scrypt password hash stored in Secret Manager. Passwords and hashes never ship to the browser. A random bearer session lives only in page memory and expires after 12 hours. Refreshing or moving between admin pages asks for the password again. There are no accounts, email, or recovery links.
2. Ten attempts per source IP are allowed in a two-minute window, persisted atomically in Firestore. Further attempts receive HTTP 429 and Retry-After. The platform proxy setting must stay correct for deployment.
3. The API validates metadata and issues private resumable Cloud Storage upload sessions. Files go straight to the bucket, avoiding Cloud Functions' request body limits. Original upload URLs are never public visitor data.
4. After all files are uploaded and verified, the job is queued in Firestore. `compressStory` processes it with Sharp and FFmpeg. Only a fully completed story enters the public list. A failed job never publishes partial media.
5. Photos: rotate by EXIF, max 2400px width, no upscale, WebP quality 75; 250px WebP thumbnail. Metadata is removed. Videos: max 720px height without upscaling, 24fps, H.264 CRF30, no audio, MP4 faststart, WebP poster. Unsupported HEIC encodings prompt export to JPG. Videos over three minutes are rejected rather than silently trimmed.
6. Originals are deleted after processing. Configure the incoming-prefix lifecycle rule below to remove abandoned uploads. Completed media uses download-token URLs; Firestore and Storage client rules otherwise deny all access.
7. Deleting a story deletes its compressed media before removing its record; a storage failure is reported and can be retried. Already downloaded/cached copies cannot be recalled.

Live API: `https://storiesapi-dc5a4kthhq-ew.a.run.app`. Both functions are deployed. Incoming originals expire after one day; session and attempt records use Firestore TTL. Build artifacts older than seven days are cleaned up while retaining the two latest versions.

## Local preview

Requires Node 22.13+; FFmpeg is installed by `ffmpeg-static`.

```sh
cd stories/backend
npm ci
# Supply STORIES_PASSWORD_HASH in ignored .env.preview; never put a plaintext password in source.
npm start
```

Preview: `http://localhost:8787/stories.html`; admin pages use the same host. The local service serves an explicit allowlist of web files, not its configuration files or source. Local media and database are in ignored `stories/backend/local-data/`. Preview stories are not deployed.

Generate a hash without putting the password into a command or history:

```sh
node password.mjs
```

## Deployment and redeployment

1. Enable Blaze for `radim-theiner-diary` using the chosen billing account.
2. Create Firestore in Native mode in `europe-west1` and a Firebase Storage bucket in the same region. Set the `STORIES_BUCKET` Firebase parameter to its exact bucket name.
3. Store the generated password hash with `firebase functions:secrets:set STORIES_PASSWORD_HASH --data-file PATH_TO_PRIVATE_HASH --project radim-theiner-diary`. Delete the temporary hash file afterwards. Never commit or print it.
4. Set the bucket CORS configuration to the `storage-cors.json` file in `stories/backend`. Resumable session creation must include the requesting Origin (implemented).
5. Set the bucket lifecycle configuration to `storage-lifecycle.json`: remove abandoned originals older than one day. Do not apply an expiration rule to the `media/` prefix.
6. Enable Firestore TTL for `sessions.expireAt` and `attempts.expireAt`. Expiration is checked in the application even if TTL deletion is delayed.
7. Run `firebase deploy --only functions,firestore:rules,storage --project radim-theiner-diary`.
8. Put the returned `storiesApi` function URL into the production `apiBase` in `stories/config.js`. Keep the localhost branch for preview. No private Firebase configuration belongs in that file.
9. Publish the frontend through the existing GitHub Pages main branch. Verify a real upload and delete in the deployed admin UI; then verify the visitor page from both apex and www origins.

Keep incoming upload sessions private. API writes require a valid session and browser requests require an allowed origin. The public API only returns title, date, text and compressed media URLs. Max uploads: 20 files, 100 MB each, 500 MB total. The processing function has one concurrent worker and bounded runtime. Very large sets of videos may need to be split across stories.

Edits use an authenticated PATCH endpoint. The server validates retained media indexes and checks a revision before saving, so stale editors cannot silently overwrite newer edits. Retained images are reused without recompression. Edits with new uploads run through the compression worker and replace the existing story atomically only after all new files are ready and the revision still matches. Removed media is cleaned up after the saved story changes; failed processing leaves the original story intact. New and existing media can be reordered together before saving.

## Validation

`npm test --prefix stories/backend` exercises validation, auth, failed-attempt lockout, origin rejection, real photo/video compression, no partial publication, persistent local data, logout, incomplete uploads, duplicate submission, and media deletion. Browser checks cover the responsive visitor layout, timeline, thumbnails, forms and navigation. Firebase-specific credentials, bucket CORS and event delivery require deployed verification.

### Story analytics

The public diary uses the existing radim-theiner.goatcounter.com account. `/stories.html` records entry to the diary; `/stories.html#<story-id>` records each viewed story with a readable `Stories — <title>` label. In GoatCounter's Pages list, filter for `/stories.html` and use titles to identify stories. Stable IDs keep counts together when a title is edited; the path links directly to that story. Each story counts once per page load after 700ms visible, skipping rapid navigation. GoatCounter's normal session deduplication remains enabled. Local previews and management pages do not load this tracker. Blocked analytics never prevents browsing. This measures views, not time spent.
