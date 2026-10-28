const fs = require('node:fs');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDir) {
    this.storageDir = path.resolve(storageDir);
    this.documents = new Map();
    fs.mkdirSync(this.storageDir, { recursive: true });
  }

  create(file, owner) {
    const document = {
      id: file.filename,
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      storedName: file.filename,
    };

    this.documents.set(document.id, document);
    return this.toPublicDocument(document);
  }

  findByOwner(owner) {
    return Array.from(this.documents.values())
      .filter((document) => document.owner === owner)
      .map((document) => this.toPublicDocument(document));
  }

  findById(id) {
    return this.documents.get(id) || null;
  }

  async findStoredFile(document) {
    const filePath = path.join(this.storageDir, document.storedName);

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
      return filePath;
    } catch {
      return null;
    }
  }

  toPublicDocument(document) {
    const { storedName, ...publicDocument } = document;
    return publicDocument;
  }
}

module.exports = DocumentRepository;