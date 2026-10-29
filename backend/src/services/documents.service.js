const documentsRepository = require('../repositories/documents.repository');

function toMetadata(document) {
  const { path, ...metadata } = document;
  return metadata;
}

function createDocument(file, owner) {
  const document = documentsRepository.save({
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    createdAt: new Date().toISOString(),
    owner: typeof owner === 'string' ? owner.trim() || null : null,
    path: file.path,
  });
  return toMetadata(document);
}

function listDocuments() {
  return documentsRepository.findAll().map(toMetadata);
}

function getDocument(id) {
  const document = documentsRepository.findById(id);
  if (!document) {
    const error = new Error('Documento nao encontrado.');
    error.status = 404;
    throw error;
  }
  return document;
}

module.exports = { createDocument, listDocuments, getDocument  };