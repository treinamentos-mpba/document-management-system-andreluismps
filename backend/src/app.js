const express = require('express');
const path = require('node:path');
const DocumentRepository = require('./repositories/documentRepository');
const createDocumentService = require('./services/documentService');
const createDocumentController = require('./controllers/documentController');
const createDocumentRouter = require('./routes/documentRoutes');

const DEFAULT_STORAGE_DIR = path.join(__dirname, '../storage');

function createApp({
  storageDir = process.env.STORAGE_DIR || DEFAULT_STORAGE_DIR,
  maxFileSizeBytes = Number(process.env.MAX_FILE_SIZE_BYTES) || 10 * 1024 * 1024,
} = {}) {
  const app = express();
  const documentRepository = new DocumentRepository(storageDir);
  const documentService = createDocumentService(documentRepository);
  const documentController = createDocumentController(documentService);

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocumentRouter({
    controller: documentController,
    storageDir,
    maxFileSizeBytes,
  }));

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error.name === 'MulterError') {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      return res.status(tooLarge ? 413 : 400).json({
        error: {
          code: tooLarge ? 'FILE_TOO_LARGE' : 'UPLOAD_INVALID',
          message: tooLarge
            ? 'O arquivo excede o tamanho máximo permitido.'
            : 'Não foi possível processar o arquivo enviado.',
        },
      });
    }

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: statusCode === 500
          ? 'Ocorreu um erro interno. Tente novamente.'
          : error.message,
      },
    });
  });

  return app;
}

const app = createApp();
app.createApp = createApp;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
