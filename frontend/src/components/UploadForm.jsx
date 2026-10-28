import { useState } from 'react';

export default function UploadForm({ onUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.file.files[0];

    if (file && await onUpload(file)) {
      form.reset();
      setSelectedFile(null);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-picker" htmlFor="document-file">
        <span className="file-picker-mark" aria-hidden="true">+</span>
        <span className="file-picker-copy">
          <strong>{selectedFile ? selectedFile.name : 'Escolha um documento'}</strong>
          <span>{selectedFile ? formatSize(selectedFile.size) : 'Qualquer formato, até 10 MiB'}</span>
        </span>
        <span className="file-picker-action">Selecionar</span>
      </label>
      <input
        className="visually-hidden"
        id="document-file"
        name="file"
        type="file"
        required
        onChange={(event) => setSelectedFile(event.target.files[0] || null)}
      />
      <button className="button button-primary upload-submit" type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
    </form>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}