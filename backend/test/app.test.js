const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

async function startTestServer(options = {}) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const server = app.createApp({ storageDir, ...options }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    storageDir,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await fs.rm(storageDir, { recursive: true, force: true });
    },
  };
}

async function uploadFile(baseUrl, owner = 'usuario-1', contents = 'conteudo') {
  const form = new FormData();
  form.append('file', new Blob([contents], { type: 'text/plain' }), 'relatorio.txt');
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload local e lista documentos apenas do usuário', async (context) => {
  const server = await startTestServer();
  context.after(() => server.close());

  const uploadResponse = await uploadFile(server.baseUrl);
  const { document } = await uploadResponse.json();
  assert.equal(uploadResponse.status, 201);
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.size, Buffer.byteLength('conteudo'));
  assert.equal(document.owner, 'usuario-1');
  assert.ok(Number.isNaN(Date.parse(document.uploadedAt)) === false);

  const storedFiles = await fs.readdir(server.storageDir);
  assert.deepEqual(storedFiles, [document.id]);

  const ownList = await fetch(`${server.baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-1' },
  });
  const otherList = await fetch(`${server.baseUrl}/documents`, {
    headers: { 'X-User-Id': 'usuario-2' },
  });
  assert.deepEqual((await ownList.json()).documents, [document]);
  assert.deepEqual((await otherList.json()).documents, []);
});

test('baixa documento do dono e oculta documento de outro usuário', async (context) => {
  const server = await startTestServer();
  context.after(() => server.close());

  const uploadResponse = await uploadFile(server.baseUrl);
  const { document } = await uploadResponse.json();
  const downloadResponse = await fetch(
    `${server.baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'usuario-1' } },
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'conteudo');
  assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);

  const forbiddenResponse = await fetch(
    `${server.baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'usuario-2' } },
  );
  assert.equal(forbiddenResponse.status, 404);
  assert.equal((await forbiddenResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('valida usuário, arquivo e limite de tamanho', async (context) => {
  const server = await startTestServer({ maxFileSizeBytes: 4 });
  context.after(() => server.close());

  const missingUser = await uploadFile(server.baseUrl, ' ');
  assert.equal(missingUser.status, 400);
  assert.equal((await missingUser.json()).error.code, 'USER_ID_REQUIRED');

  const missingFile = await fetch(`${server.baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-1' },
  });
  assert.equal(missingFile.status, 400);
  assert.equal((await missingFile.json()).error.code, 'FILE_REQUIRED');

  const tooLarge = await uploadFile(server.baseUrl, 'usuario-1', 'arquivo');
  assert.equal(tooLarge.status, 413);
  assert.equal((await tooLarge.json()).error.code, 'FILE_TOO_LARGE');
});
