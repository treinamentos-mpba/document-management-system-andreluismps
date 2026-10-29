const { randomUUID } = require('node:crypto');
const { mkdir } = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const storageDirectory = path.resolve(__dirname, '../../storage');
const storage = multer.diskStorage({
  destination(req, file, callback) {
    mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({ storage });
const router = express.Router();

router.post('/upload', upload.single('file'), documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

module.exports = router;