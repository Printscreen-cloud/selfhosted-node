import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import logic from '../classes/logic.js';
import storage from '../classes/storage.js';

test('resolvePublicPath contains paths inside the public directory', () => {
  const nested = logic.resolvePublicPath('nested', 'file.txt');
  assert.equal(path.basename(nested), 'file.txt');
  assert.match(nested, /public[\\/]nested[\\/]file\.txt$/);
  assert.throws(() => logic.resolvePublicPath('..', 'outside.txt'), /outside the public folder/);
  assert.throws(() => logic.resolvePublicPath(path.parse(process.cwd()).root, 'outside.txt'), /outside the public folder/);
});

test('folderSize counts regular files recursively without shell commands', async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'selfhosted-node-'));
  t.after(() => fs.promises.rm(directory, { recursive: true, force: true }));
  await fs.promises.mkdir(path.join(directory, 'nested'));
  await fs.promises.writeFile(path.join(directory, 'a.txt'), '1234');
  await fs.promises.writeFile(path.join(directory, 'nested', 'b.txt'), '123456');
  assert.equal(await storage.folderSize(directory), 10);
});

test('freeSpace uses the native filesystem API', async () => {
  assert.ok(await storage.freeSpace() > 0);
});
