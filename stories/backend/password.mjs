import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';
import { passwordHash } from './core.mjs';
// Read from a pipe to avoid putting the password in shell history or echoing it.
if (process.stdin.isTTY) {
  console.error('Pipe the password through stdin from a secure prompt: read -s stories_password; printf %s "$stories_password" | node password.mjs; unset stories_password');
  process.exit(1);
}
let password = '';
for await (const line of createInterface({ input: process.stdin })) password += line;
if (!password || password.length > 256) throw new Error('Supply a password of 1–256 characters.');
writeFileSync('.env.preview',`STORIES_PASSWORD_HASH=${passwordHash(password)}\n`,{mode:0o600});
console.log('Saved local password hash to ignored .env.preview.');
