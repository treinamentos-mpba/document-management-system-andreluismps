import { useEffect, useState } from 'react';
import DocumentList from '../components/DocumentList.jsx';
import UploadForm from '../components/UploadForm.jsx';
import {
  downloadDocument,
  listDocuments,
  uploadDocument,
} from '../services/documentService.js';

export default function DocumentsPage() {
  const [userId, setUserId] = useState('usuario-1');
  const [userIdDraft, setUserIdDraft] = useState('usuario-1');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage('');

    listDocuments(userId, controller.signal)
      .then(setDocuments)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setDocuments([]);
          setErrorMessage(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [userId]);

  async function handleUpload(file) {
    setIsUploading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      await uploadDocument(userId, file);
      setDocuments(await listDocuments(userId));
      setStatusMessage('Documento enviado.');
      return true;
    } catch (error) {
      setErrorMessage(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setErrorMessage('');

    try {
      await downloadDocument(userId, document);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setDownloadingId(null);
    }
  }

  function handleUserSubmit(event) {
    event.preventDefault();
    const nextUserId = userIdDraft.trim();

    if (!nextUserId) {
      setErrorMessage('Informe um identificador de usuário.');
      return;
    }

    setErrorMessage('');
    setStatusMessage('');
    setUserId(nextUserId);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Arquivo, início">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>arquivo<span className="brand-period">.</span></span>
        </a>
        <span className="topbar-caption">GESTÃO DE DOCUMENTOS</span>
        <span className="local-indicator"><span /> ARMAZENAMENTO LOCAL</span>
      </header>

      <main className="workspace">
        <section className="workspace-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">ESPAÇO DE TRABALHO <span>/</span> 01</p>
            <h1 id="page-title">Seus documentos</h1>
            <p className="page-description">Um lugar simples para guardar e acessar seus arquivos.</p>
          </div>
          <div className="document-counter" aria-live="polite">
            <strong>{String(documents.length).padStart(2, '0')}</strong>
            <span>{documents.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </section>

        <section className="user-toolbar" aria-label="Identificação do usuário">
          <form className="user-form" onSubmit={handleUserSubmit}>
            <label htmlFor="user-id">Identificador</label>
            <input
              id="user-id"
              value={userIdDraft}
              onChange={(event) => setUserIdDraft(event.target.value)}
              autoComplete="off"
              maxLength={100}
            />
            <button className="button button-subtle" type="submit">Abrir arquivo</button>
          </form>
          <span className="user-note">Organização local, sem autenticação</span>
        </section>

        <section className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADICIONAR AO ARQUIVO</p>
              <h2 id="upload-title">Enviar documento</h2>
            </div>
            <span className="section-number">01</span>
          </div>
          <UploadForm onUpload={handleUpload} isUploading={isUploading} />
        </section>

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading documents-heading">
            <div>
              <p className="eyebrow">SEU ESPAÇO</p>
              <h2 id="documents-title">Arquivo</h2>
            </div>
            <span className="section-number">02</span>
          </div>

          {errorMessage && <p className="feedback feedback-error" role="alert">{errorMessage}</p>}
          {statusMessage && <p className="feedback feedback-success" role="status">{statusMessage}</p>}
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            downloadingId={downloadingId}
            onDownload={handleDownload}
          />
        </section>

        <footer className="page-footer">
          <span>ARQUIVO <span className="brand-period">LOCAL</span></span>
          <span>Os metadados existem enquanto o servidor estiver ativo.</span>
        </footer>
      </main>
    </div>
  );
}