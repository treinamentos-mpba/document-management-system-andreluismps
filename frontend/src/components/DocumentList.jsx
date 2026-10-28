const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function DocumentList({ documents, isLoading, downloadingId, onDownload }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-index">00</span>
        <p>Nenhum documento neste arquivo.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Documento</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>
                <span className="document-name">{document.originalName}</span>
                <span className="document-owner">ID {document.id.slice(0, 8)}</span>
              </td>
              <td className="document-metadata">{formatSize(document.size)}</td>
              <td className="document-metadata">{formatDate(document.uploadedAt)}</td>
              <td className="document-action-cell">
                <button
                  className="button button-download"
                  type="button"
                  onClick={() => onDownload(document)}
                  disabled={downloadingId === document.id}
                  aria-label={`Baixar ${document.originalName}`}
                >
                  {downloadingId === document.id ? 'Baixando...' : 'Baixar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : dateFormatter.format(date);
}