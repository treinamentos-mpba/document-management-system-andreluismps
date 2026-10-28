# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, armazenando os arquivos no filesystem local e mantendo metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de documentos, um arquivo por requisição.
- Listagem dos documentos associados ao identificador do usuário.
- Download de um documento pelo identificador, limitado ao usuário associado.
- Armazenamento local em `backend/storage`, configurável por variável de ambiente e implementado com `multer`/`diskStorage`.
- Metadados mantidos em memória durante a execução do processo.
- Interface React para upload, listagem e download.
- Configuração por variáveis de ambiente e proxy do Vite para `/api`.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Banco de dados ou persistência dos metadados após reinício.
- Autenticação, cadastro de usuários e recuperação de senha.
- Versionamento, compartilhamento, edição ou exclusão de documentos.
- Busca avançada e paginação.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo via `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema rejeita requisições sem identificador de usuário ou sem arquivo. |
| RF-03 | O sistema associa o documento ao valor recebido no cabeçalho `X-User-Id`. |
| RF-04 | O sistema gera identificador e nome físico aleatórios, sem usar o nome enviado pelo usuário como caminho. |
| RF-05 | O sistema grava o arquivo no filesystem local usando `multer` com `diskStorage`. |
| RF-06 | O upload retorna os metadados públicos do documento criado. |
| RF-07 | A listagem retorna somente documentos associados ao `X-User-Id` informado. |
| RF-08 | O download retorna o conteúdo binário de um documento pertencente ao usuário. |
| RF-09 | Documento inexistente, de outro usuário ou indisponível no disco retorna `404`. |
| RF-10 | A interface permite selecionar e enviar um arquivo e atualiza a listagem após sucesso. |
| RF-11 | A interface permite informar o identificador de usuário, listar documentos e solicitar download. |
| RF-12 | A interface apresenta estados de carregamento e mensagens de sucesso ou erro. |
| RF-13 | O endpoint `GET /health` permanece disponível. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Arquivos são armazenados somente no filesystem local, por padrão em `backend/storage`. |
| RNF-02 | Metadados são voláteis e mantidos em memória. |
| RNF-03 | `PORT` configura a porta HTTP; o valor padrão é `3000`. |
| RNF-04 | `STORAGE_DIR` configura o diretório local dos arquivos. |
| RNF-05 | `MAX_FILE_SIZE_BYTES` configura o limite de upload; o padrão é 10 MiB. |
| RNF-06 | Erros da API usam JSON com código e mensagem em português. |
| RNF-07 | O download é enviado como anexo e inclui o nome original na resposta. |
| RNF-08 | O backend segue `routes -> controllers -> services -> repositories`. |
| RNF-09 | O frontend usa `fetch` com prefixo `/api`; o proxy de desenvolvimento encaminha ao backend. |
| RNF-10 | O projeto usa JavaScript, Express/CommonJS no backend, React/Vite/ESM no frontend e `node:test` no backend. |

## 5. Modelo de dados

| Campo | Tipo | Exposição | Descrição |
| --- | --- | --- | --- |
| `id` | string | API | Identificador único do documento, gerado pelo sistema. |
| `originalName` | string | API | Nome original fornecido no upload. |
| `size` | number | API | Tamanho em bytes. |
| `uploadedAt` | string | API | Data/hora do upload em ISO 8601. |
| `owner` | string | API | Identificador de usuário recebido em `X-User-Id`. |
| `storedName` | string | Interno | Nome gerado para o arquivo local; nunca é exposto. |

Os metadados ficam em memória. Reiniciar o processo remove as associações, mesmo que os arquivos permaneçam no diretório local. O cabeçalho `X-User-Id` é somente um mecanismo de organização nesta fase, não uma credencial ou fronteira de segurança.

## 6. Contratos de API

No navegador, as chamadas usam o prefixo `/api`. O proxy do Vite remove esse prefixo; no backend, as rotas são montadas diretamente em `/upload`, `/documents` e `/documents/:id/download`.

### Upload

- URL no navegador: `POST /api/upload`.
- URL no backend: `POST /upload`.
- Cabeçalho obrigatório: `X-User-Id: <identificador>`.
- Corpo: `multipart/form-data` com arquivo no campo `file`.
- Sucesso: `201 Created`.

```json
{
  "document": {
    "id": "uuid",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-28T12:00:00.000Z",
    "owner": "usuario-1"
  }
}
```

### Listagem

- URL no navegador: `GET /api/documents`.
- URL no backend: `GET /documents`.
- Cabeçalho obrigatório: `X-User-Id: <identificador>`.
- Sucesso: `200 OK`, com `{ "documents": [...] }`; lista vazia quando não houver documentos.

### Download

- URL no navegador: `GET /api/documents/:id/download`.
- URL no backend: `GET /documents/:id/download`.
- Cabeçalho obrigatório: `X-User-Id: <identificador>`.
- Sucesso: `200 OK`, corpo binário e `Content-Disposition: attachment` com o nome original.

### Erros

Respostas de erro usam `{ "error": { "code": "...", "message": "..." } }`.

| Status | Condição | Código |
| --- | --- | --- |
| `400` | Cabeçalho ausente ou arquivo não enviado | `USER_ID_REQUIRED` ou `FILE_REQUIRED` |
| `400` | Upload inválido | `UPLOAD_INVALID` |
| `413` | Arquivo acima do limite | `FILE_TOO_LARGE` |
| `404` | Documento inexistente, sem acesso ou arquivo indisponível | `DOCUMENT_NOT_FOUND` |
| `500` | Falha inesperada | `INTERNAL_ERROR` |

## 7. Decisões arquiteturais

- `routes/` conecta endpoints, middleware Multer e controllers.
- `controllers/` valida contexto HTTP e monta respostas.
- `services/` aplica regras de negócio, incluindo a associação com o usuário e a autorização do download.
- `repositories/` mantém os metadados em memória e localiza os arquivos no diretório local.
- Multer salva arquivos com nomes aleatórios em `STORAGE_DIR`; nomes fornecidos pelo usuário não determinam caminhos físicos.
- A interface é organizada em páginas, componentes e serviço de API, com componentes React e `fetch`.
- O erro de identidade é deliberado: `X-User-Id` não autentica usuários e deve ser substituído por identidade confiável antes de qualquer implantação multiusuário.

## 8. Plano de execução

1. Criar e revisar esta especificação antes da implementação dos módulos da aplicação.
2. Implementar as rotas, controllers, services e repositories do backend; validar upload, listagem, download, isolamento por usuário, erros e limite de tamanho com testes `node:test`.
3. Implementar serviço de API, página e componentes do frontend para upload, listagem e download, incluindo estados de carregamento e erro.
4. Validar build do frontend, suíte do backend e integração local com proxy e endpoint de saúde.

## 9. Riscos e critérios da fase inicial

- Metadados são perdidos no reinício; os arquivos no disco podem ficar sem referência.
- Sem autenticação, um cliente pode escolher qualquer `X-User-Id`; o isolamento é funcional, não uma garantia de segurança.
- O armazenamento local depende do espaço e das permissões do filesystem e não tem backup automático.
- O tamanho é limitado, mas não há lista de MIME types permitidos nesta fase; nomes e tipos enviados pelo cliente não devem ser confiados para definir caminhos ou permissões.