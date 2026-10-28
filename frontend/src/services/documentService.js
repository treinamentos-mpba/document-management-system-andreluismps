const API_BASE_URL = '/api';

async function parseResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Não foi possível concluir a operação.');
  }

  return response.json();
}

function userHeaders(userId) {
  return { 'X-User-Id': userId };
}

export async function listDocuments(userId, signal) {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    headers: userHeaders(userId),
    signal,
  });
  const body = await parseResponse(response);
  return body.documents;
}

export async function uploadDocument(userId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: userHeaders(userId),
    body: formData,
  });
  const body = await parseResponse(response);
  return body.document;
}

export async function downloadDocument(userId, document) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${encodeURIComponent(document.id)}/download`,
    { headers: userHeaders(userId) },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Não foi possível baixar o documento.');
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}