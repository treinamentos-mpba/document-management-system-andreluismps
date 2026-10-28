const { randomUUID } = require('node:crypto');
const multer = require('multer');
const express = require('express');

function createDocumentRouter({ controller, storageDir, maxFileSizeBytes }) {
  const router = express.Router();
  const upload = multer({
    storage: multer.diskStorage({
      destination: storageDir,
      filename(req, file, callback) {
        callback(null, randomUUID());
      },
    }),
    limits: { fileSize: maxFileSizeBytes },
  });

  router.post('/upload', controller.requireUser, upload.single('file'), controller.upload);
  router.get('/documents', controller.requireUser, controller.list);
  router.get('/documents/:id/download', controller.requireUser, controller.download);

  return router;
}

module.exports = createDocumentRouter;