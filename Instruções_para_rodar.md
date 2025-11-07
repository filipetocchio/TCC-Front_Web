#### Configuração do Frontend (React)


```bash

# Navegue até a pasta do frontend
cd TCC-Front_Web

# Instale as dependências
npm install

# Crie o arquivo .env na raiz de 'TCC-Front_Web' e copie o conteúdo abaixo.
```

**Conteúdo para o arquivo `.env` do Frontend:**

```env
# Aponta para a URL da  API Node.js
VITE_API_URL="http://localhost:8001/api/v1"
```

**Continue os comandos no terminal do frontend:**

```bash
# Inicie a aplicação React (deixe este terminal aberto)
npm run dev
```

> **Nota:** A aplicação React estará acessível em `http://localhost:3000`.

### Resumo da Execução

Ao final, você terá 3 terminais abertos, cada um executando um serviço:
-   **Terminal 1 (OCR):** `python app.py`
-   **Terminal 2 (Backend):** `npm run dev`
-   **Terminal 3 (Frontend):** `npm run dev`

Abra seu navegador em `http://localhost:3000` para acessar o sistema Qota.