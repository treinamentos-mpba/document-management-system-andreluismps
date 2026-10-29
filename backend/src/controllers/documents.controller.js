const documentsService = require('../services/documents.service');

function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Envie um arquivo no campo file.' });
  }

  const document = documentsService.createDocument(req.file, req.body.owner);
  return res.status(201).json(document);
}

function list(req, res) {
  res.json(documentsService.listDocuments());
}

function download(req, res, next) {
  const document = documentsService.getDocument(req.params.id);
  res.download(document.path, document.originalName, (error) => {
    if (error) next(error);
  });
}

module.exports = { upload, list, download };