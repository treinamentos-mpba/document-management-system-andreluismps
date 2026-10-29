const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const { readFile, rm } = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

let server;
let baseUrl;
const uploadedIds = [];

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  await Promise.all(uploadedIds.map((id) => rm(
    path.resolve(__dirname, '../storage', id), { force: true },
  )));
});

test('preserva a rota de saude', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), { status: 'ok' });
});

test('lista documentos inicialmente vazios', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(await response.json(), []);
});

test('envia, armazena, lista e baixa um documento', async () => {
  const content = 'Conteudo do documento de teste';
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/plain' }), 'documento.txt');
  form.append('owner', 'usuario-1');

  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(response.status, 201);
  const document = await response.json();
  uploadedIds.push(document.id);
  assert.match(document.id, /^[0-9a-f-]{36}$/);
  assert.strictEqual(document.originalName, 'documento.txt');
  assert.strictEqual(document.size, Buffer.byteLength(content));
  assert.strictEqual(document.owner, 'usuario-1');
  assert.ok(Number.isFinite(Date.parse(document.createdAt)));
  assert.strictEqual(document.path, undefined);
  assert.strictEqual(await readFile(path.resolve(__dirname, '../storage', document.id), 'utf8'), content);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.deepStrictEqual(await listResponse.json(), [document]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment; filename="documento.txt"/);
  assert.strictEqual(await downloadResponse.text(), content);

  await rm(path.resolve(__dirname, '../storage', document.id));
  const missingFileResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(missingFileResponse.status, 404);
  assert.deepStrictEqual(await missingFileResponse.json(), { error: 'Documento nao encontrado.' });
});

test('rejeita upload sem arquivo', async () => {
  const response = await fetch(`${baseUrl}/upload`, { method: 'POST' });
  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(await response.json(), { error: 'Envie um arquivo no campo file.' });
});

test('rejeita arquivo em campo inesperado', async () => {
  const form = new FormData();
  form.append('unexpected', new Blob(['teste']), 'documento.txt');
  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(response.status, 400);
  assert.ok((await response.json()).error);
});

test('retorna 404 para documento inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/inexistente/download`);
  assert.strictEqual(response.status, 404);
  assert.deepStrictEqual(await response.json(), { error: 'Documento nao encontrado.' });
});
