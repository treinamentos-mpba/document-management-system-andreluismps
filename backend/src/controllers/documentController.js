function createDocumentController(documentService) {
  function requireUser(req, res, next) {
    const owner = req.get('X-User-Id')?.trim();

    if (!owner) {
      return res.status(400).json({
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'Informe o identificador do usuário.',
        },
      });
    }

    req.userId = owner;
    return next();
  }

  return {
    requireUser,

    async upload(req, res) {
      const document = documentService.uploadDocument(req.file, req.userId);
      res.status(201).json({ document });
    },

    list(req, res) {
      res.json({ documents: documentService.listDocuments(req.userId) });
    },

    async download(req, res) {
      const { document, filePath } = await documentService.getDocumentForDownload(
        req.params.id,
        req.userId,
      );

      res.download(filePath, document.originalName);
    },
  };
}

module.exports = createDocumentController;