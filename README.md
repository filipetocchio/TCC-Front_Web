# 📘 Visão Geral do Projeto

Este documento descreve o escopo, estrutura técnica e principais funcionalidades do MVP (Produto Mínimo Viável) da aplicação de **Cadastro e Gerenciamento de Propriedades**. A plataforma tem como objetivo oferecer aos usuários a possibilidade de registrar propriedades, manter documentação organizada e, futuramente, gerenciar aspectos financeiros, uso compartilhado e administração de cotistas.

O sistema é dividido em módulos independentes, organizados em fases de desenvolvimento incremental. Nesta primeira fase (MVP), o foco está nas funcionalidades essenciais: autenticação de usuários, cadastro de propriedades. A aplicação é composta por um front-end responsivo, uma API RESTful no back-end e um banco de dados relacional para armazenamento das informações.

Este documento técnico tem como finalidade orientar o desenvolvimento, testes e validação do sistema, bem como garantir a padronização das integrações entre front-end e back-end, respeitando os critérios de segurança, usabilidade e consistência de dados.

---

# 📌 Documentação Técnica - MVP: Cadastro de Propriedade

## 👥 Equipe
- **Front-end (2 devs)**: Implementação das telas e integração com API
- **Back-end (1 dev)**: Criação da API, banco de dados e regras de negócio
- **Tester (1)**: Garantia de aderência à documentação, padronização e qualidade

---

## 🛋 Escopo do MVP (Fase 1)
- Autenticação (Login/Cadastro com JWT)
- Tela de Dashboard Inicial
- Cadastro de Propriedade
- Tela de Gerenciamento da Propriedade (sem funcionalidades ativas)
- Controle de permissões por propriedade (usuário comum e proprietário master)

---

## 🔐 Autenticação

### 🔸 Tela de Login
**Campos:**
- `email` (string)
- `senha` (string)

**Botões:**
- Login
- Ir para cadastro

**Endpoint:**
```
POST /api/usuarios/login
```
**Body (JSON):**
```json
{
  "email": "user@email.com",
  "senha": "123456"
}
```

**Resposta:**
```json
{
  "token": "JWT-TOKEN-GERADO",
  "usuario": {
    "id": 1,
    "nomeCompleto": "João Silva",
    "email": "joao@email.com"
  }
}
```

### 🔸 Tela de Cadastro
**Campos:**
- `nomeCompleto` (string)
- `email` (string)
- `senha` (string)
- `telefone` (string)
- `cpf` (string)

**Endpoint:**
```
POST /api/usuarios/cadastrar
```
**Body (JSON):**
```json
{
  "nomeCompleto": "João Silva",
  "email": "joao@email.com",
  "senha": "123456",
  "telefone": "11999999999",
  "cpf": "12345678900"
}
```

---

## 🏠 Dashboard Inicial (Tela de Propriedades)
### 🛋 Layout
- Menu lateral (foto + botões)
- Botão: Cadastrar Propriedade
- Lista de propriedades (imagem + botão Gerenciar)
- Campo de filtro por nome/cep/tipo

**Endpoint para listagem de propriedades do usuário logado:**
```
GET /api/usuarios/{id}/propriedades
```
**Response (JSON):**
```json
[
  {
    "id": 1,
    "nomePropriedade": "Chácara Primavera",
    "imagemPrincipal": "url-da-imagem.jpg",
    "tipo": "Chácara",
    "cep": "12345-678",
    "permissao": "proprietario_master"
  }
]
```

---

## 🏗️ Tela: Cadastro de Propriedade
### 📋 Campos do formulário:
- `nomePropriedade`
- `fotos`
- `documento`
- `cep`, `cidade`, `bairro`, `logradouro`, `numero`
- `complemento`, `pontoReferencia`
- `tipo`
- `valorEstimado`

**Endpoint:**
```
POST /api/propriedades/cadastrar
```
**Ao cadastrar:** o sistema automaticamente vincula o usuário como `proprietario_master` na tabela `usuarios_propriedades`, somente para aquela propriedade.

---

## 🧰 Tela: Gerenciamento da Propriedade
### ⚙️ Layout Inicial
- Exibição dos dados da propriedade
- Botões:
  - Gerenciar Cotistas (somente para `proprietario_master` da propriedade)
  - Financeiro
  - Inventário
  - Agendamento de Uso

---

## 🔐 Permissões
### Níveis de acesso (por propriedade):
- **Proprietário Master**:
  - Cadastra, gerencia propriedade e permissões
  - Acesso total na propriedade onde possui esse vínculo
- **Usuário Comum**:
  - Acesso restrito à visualização de dados da propriedade

📌 Um mesmo usuário pode ter diferentes permissões em propriedades distintas (ex: `proprietario_master` de uma e `usuario_comum` de outra).

---

## 🔗 Integração Front <-> Back
- Formato camelCase em JSON
- Autenticação via JWT obrigatória

---

## 📋 Tabela de Atributos - Cadastro de Propriedade
| Campo                | Nome no JSON       | Tipo de dado        | Obrigatório |
|---------------------|--------------------|----------------------|-------------|
| Nome da Propriedade | nomePropriedade    | string               | Sim         |
| Valor Estimado      | valorEstimado      | number (float)       | Sim         |
| Tipo de Propriedade | tipo               | string (enum)        | Sim         |
| CEP                 | cep                | string               | Sim         |
| Cidade              | cidade             | string               | Sim         |
| Bairro              | bairro             | string               | Sim         |
| Logradouro          | logradouro         | string               | Sim         |
| Número              | numero             | string               | Sim         |
| Complemento         | complemento         | string               | Não         |
| Ponto de Referência| pontoReferencia     | string               | Não         |
| Documento           | documento           | string (base64/URL) | Sim         |
| Fotos               | fotos              | array de strings     | Sim (min. 1)|

---

## 👤 Tabela de Atributos - Cadastro de Usuário
| Campo         | Nome no JSON   | Tipo de dado          | Obrigatório |
|---------------|----------------|------------------------|-------------|
| Nome completo | nomeCompleto   | string                 | Sim         |
| E-mail        | email          | string                 | Sim         |
| Senha         | senha          | string                 | Sim         |
| Telefone      | telefone       | string                 | Sim         |
| CPF           | cpf            | string                 | Sim         |
| Foto de Perfil| fotoPerfil     | string (base64/URL)    | Não         |

---

## ✅ Regras de Validação
- Pelo menos 1 foto obrigatória
- Documento obrigatório
- CEP válido (formato brasileiro)
- `valorEstimado` > 0
- CPF e e-mail devem ser únicos
- Permissões são definidas por propriedade (vínculo específico)
- Apenas o `proprietario_master` de uma propriedade pode alterá-la

---

## 🔀 Endpoints - Usuários
```
POST   /api/usuarios/cadastrar
POST   /api/usuarios/login
GET    /api/usuarios/{id}
PUT    /api/usuarios/{id}
DELETE /api/usuarios/{id}
```

## 🏡 Endpoints - Propriedades
```
POST   /api/propriedades/cadastrar
GET    /api/propriedades/{id}
PUT    /api/propriedades/{id}
DELETE /api/propriedades/{id}
GET    /api/usuarios/{id}/propriedades
```

## 🔐 Endpoints - Permissões e Vínculos
```
GET    /api/propriedades/{id}/usuarios
POST   /api/propriedades/{id}/usuarios/{idUsuario}/permissao
DELETE /api/propriedades/{id}/usuarios/{idUsuario}
```

---

## 🗃️ Banco de Dados

### Tabela: usuarios
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomeCompleto VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(15),
    cpf VARCHAR(14) UNIQUE NOT NULL,
    dataCadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: propriedades
```sql
CREATE TABLE propriedades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomePropriedade VARCHAR(255) NOT NULL,
    enderecoCep VARCHAR(10),
    enderecoCidade VARCHAR(255),
    enderecoBairro VARCHAR(255),
    enderecoLogradouro VARCHAR(255),
    enderecoNumero VARCHAR(10),
    enderecoComplemento VARCHAR(255),
    enderecoPontoReferencia VARCHAR(255),
    tipo ENUM('Casa', 'Apartamento', 'Chacara', 'Lote', 'Outros') NOT NULL,
    valorEstimado DECIMAL(15, 2),
    documento VARCHAR(255),
    dataCadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: usuarios_propriedades
```sql
CREATE TABLE usuarios_propriedades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    idPropriedade INT NOT NULL,
    permissao ENUM('proprietario_master', 'usuario_comum') NOT NULL,
    dataVinculo DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(id),
    FOREIGN KEY (idPropriedade) REFERENCES propriedades(id),
    UNIQUE (idUsuario, idPropriedade)
);
```

### Tabela: fotos_propriedade
```sql
CREATE TABLE fotos_propriedade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idPropriedade INT,
    documento VARCHAR(255) NOT NULL,
    dataUpload DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idPropriedade) REFERENCES propriedades(id)
);
```

### Tabela: documentos_propriedade
```sql
CREATE TABLE documentos_propriedade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idPropriedade INT,
    tipoDocumento ENUM('IPTU', 'Matricula', 'Conta de Luz', 'Outros'),
    documento VARCHAR(255) NOT NULL,
    dataUpload DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idPropriedade) REFERENCES propriedades(id)
);
```

---

## 🔗 Relacionamentos (ERD)
- `usuarios` N:N `propriedades` via `usuarios_propriedades`
- `propriedades` 1:N `fotos_propriedade`
- `propriedades` 1:N `documentos_propriedade`

