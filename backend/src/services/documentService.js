function createServiceError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function createDocumentService(documentRepository) {
  return {
    uploadDocument(file, owner) {
      if (!file) {
        throw createServiceError(400, 'FILE_REQUIRED', 'Envie um arquivo para continuar.');
      }

      return documentRepository.create(file, owner);
    },

    listDocuments(owner) {
      return documentRepository.findByOwner(owner);
    },

    async getDocumentForDownload(id, owner) {
      const document = documentRepository.findById(id);

      if (!document || document.owner !== owner) {
        throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      const filePath = await documentRepository.findStoredFile(document);
      if (!filePath) {
        throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      return {
        document: documentRepository.toPublicDocument(document),
        filePath,
      };
    },
  };
}

module.exports = createDocumentService;