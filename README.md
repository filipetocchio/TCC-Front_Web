# QOTA — Documentação Técnica do Front-end

[![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow)](https://github.com/user/repo)
[![React](https://img.shields.io/badge/React-18.0.0-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-purple?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-cyan?logo=tailwindcss)](https://tailwindcss.com/)

Este documento serve como a fonte central da verdade (Single Source of Truth) para a arquitetura, conceitos, fluxos de negócio e manutenção da aplicação front-end da plataforma QOTA.

---

## 1. 📖 Visão Geral

O front-end do QOTA é uma **Single Page Application (SPA)** robusta, construída com **React 18** e **Vite**. A aplicação serve como a interface do cliente para um sistema de gerenciamento de bens compartilhados, comunicando-se com um back-end via API REST.

A arquitetura é componentizada e reativa, focando na separação clara de responsabilidades (SoC) e na manutenibilidade a longo prazo.

### 1.1. Stack de Tecnologia Principal

Uma visão geral das tecnologias centrais utilizadas neste projeto, com base no `package.json`:

* **Framework de UI:** React 18
* **Build Tool:** Vite
* **Estilização:** Tailwind CSS (com `clsx` para classes condicionais)
* **Roteamento:** React Router DOM v7
* **Cliente HTTP:** Axios
* **Gerenciamento de Estado:** React Context API (para autenticação global) e estado local de componentes.
* **Testes:** Vitest, Testing Library e JSDOM
* **Componentes de UI:**
    * **Ícones:** Lucide React
    * **Notificações (Toasts):** React Hot Toast
    * **Calendário:** React Big Calendar
    * **Gráficos:** Recharts
* **Utilitários:** `date-fns` (manipulação de datas), `prop-types` (validação de componentes)

### 1.2. Recursos e Funcionalidades

A aplicação implementa os seguintes módulos de negócio principais:

* **Autenticação:** Fluxo completo de login (com JWT), registro, logout e restauração de sessão (via refresh token em cookie httpOnly).
* **Gerenciamento de Propriedades:** Cadastro (com validação de endereço por IA), edição, visualização e exclusão de propriedades.
* **Gestão de Cotistas (Membros):** Fluxo de convite (com 3 cenários), gerenciamento de permissões (Master/Comum) e remoção de membros.
* **Módulo Financeiro:** Dashboard com gráficos, registro de despesas (manual ou por IA/OCR), upload de comprovantes, divisão de custos por cotista e geração de relatórios.
* **Módulo de Calendário (Agenda):** Visualização de reservas, criação de agendamentos (validando saldo de diárias), e gerenciamento de regras de uso.
* **Fluxo de Check-in/Check-out:** Sistema de checklist de inventário para registrar a entrada e saída de uma propriedade.
* **Gestão de Inventário:** CRUD completo de itens de inventário, incluindo upload de múltiplas fotos por item.

---

## 2. 🚀 Configuração e Execução

### 2.1. Pré-requisitos

* Node.js (versão 20.x ou superior recomendada)
* NPM (gerenciador de pacotes)
* Uma instância do back-end QOTA em execução.

### 2.2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (`TCC-Front_Web/.env`). Este arquivo é ignorado pelo Git e contém as chaves de API.

    # URL base da API do back-end
    VITE_API_URL="http://localhost:8001/api/v1"

### 2.3. Instalação e Execução

1.  **Instale as dependências:**

        npm install

2.  **Execute em modo de desenvolvimento:**

        npm run dev

    A aplicação estará disponível em `http://localhost:3000`.

### 2.4. Scripts Disponíveis

* `npm run dev`: Inicia o servidor de desenvolvimento Vite.
* `npm run build`: Compila a aplicação para produção.
* `npm run lint`: Executa o linter (ESLint) para análise de código.
* `npm run test`: Executa a suíte de testes do Vitest.

---

## 3. 🏗️ Arquitetura e Conceitos Fundamentais

A arquitetura do QOTA é projetada para ser escalável e modular.

### 3.1. Fluxo de Autenticação (O "Coração" da App)

O gerenciamento de sessão é o fluxo mais crítico da aplicação.

1.  **Carregamento (`AuthProvider.jsx`):** Quando a aplicação é iniciada, o `AuthProvider` entra em estado de carregamento (`authLoading: true`). Ele imediatamente tenta restaurar a sessão fazendo uma requisição `POST /auth/refresh` (que utiliza o cookie `httpOnly` seguro).
2.  **Proteção (`ProtectedRoute.jsx`):** Durante esse tempo, o `ProtectedRoute` (que envolve todas as páginas privadas) vê que `authLoading` é `true` e renderiza um spinner global. Isso previne que o usuário seja redirecionado para o login prematuramente.
3.  **Resultado da Restauração:**
    * **Sucesso:** A API retorna um novo `accessToken` e os dados do `usuario`. O `AuthProvider` os salva no estado, define `authLoading: false` e `isAuthenticated: true`. O `ProtectedRoute` vê a mudança e renderiza a página solicitada (ex: `/home`).
    * **Falha:** A API retorna um erro (ex: 401). O `AuthProvider` define `authLoading: false` e `isAuthenticated: false`. O `ProtectedRoute` vê a mudança e redireciona o usuário para `/login`.
4.  **Login Manual (`LoginForm.jsx`):** O usuário insere credenciais. Em caso de sucesso, a função `login()` do `AuthContext` é chamada, salvando o `usuario` e o `token` no estado.
5.  **Logout (`Sidebar.jsx`):** O usuário clica em "Sair". A função `logout()` do `AuthContext` é chamada, que:
    * Envia `POST /auth/logout` para invalidar o refresh token no back-end.
    * Limpa o estado (`usuario`, `token`).
    * Limpa o `localStorage`.
    * Remove o header `Authorization` do `api.js`.
6.  **Expiração de Sessão (`api.js`):** Se o usuário estiver navegando e seu `accessToken` expirar, qualquer requisição à API falhará com `401` ou `403`. O **interceptor de resposta** do Axios detecta isso, executa o `logout()` automaticamente e força o redirecionamento para `/login`.

### 3.2. Gerenciamento de Estado

O estado da aplicação é dividido em duas categorias:

1.  **Estado Global (`context/AuthContext.jsx`):** Usado *exclusivamente* para o estado de autenticação (dados do `usuario`, `token`, `authLoading` e as funções `login`/`logout`/`updateUser`).
2.  **Estado Local (Component State):** Todo o restante do estado (listas, dados de formulários, estados de loading de UI, etc.) é gerenciado localmente dentro das páginas (`src/pages`) ou em hooks customizados (`src/hooks`), usando `useState`, `useCallback`, e `useMemo`.

### 3.3. Camada de Serviços e API

* **`services/api.js`:** É a instância centralizada do **Axios**.
    * Define o `baseURL` a partir do `.env`.
    * Define `withCredentials: true`, que é **essencial** para que o navegador envie o cookie `httpOnly` (refresh token) em todas as requisições.
    * Contém o interceptor de resposta que trata a expiração de sessão (401/403).
* **`services/propertyService.js`:** Abstrai chamadas de API específicas, como `getPropertiesByUserId`.
* **Hooks de Dados (`hooks/useUserProperties.js`):** Encapsula a lógica de *busca* de dados. Ele gerencia seus próprios estados de `loading`, `error`, `pagination` e `data`, fornecendo uma interface limpa para os componentes de página (como `Home.jsx`).

### 3.4. Estilização

* **Tailwind CSS:** É o framework de estilização principal.
* **`tailwind.config.js`:** Define o tema central da aplicação, incluindo a paleta de cores (`gold: '#C89116'`) e os gradientes (`gold-gradient-vertical`).
* **`components/ui/`:** Esta pasta é a "Biblioteca de Componentes" base. Componentes como `dialog.jsx`, `Input.jsx`, e `FormComponents.jsx` são usados para construir todos os outros componentes e páginas, garantindo consistência visual.

### 3.5. Pipeline de CI/CD

O projeto possui um pipeline de Integração Contínua definido em `.github/workflows/ci.yml`.

* **Gatilhos:** Ocorre em `push` ou `pull_request` para a branch `main`.
* **Job (`frontend-ci`):** Executa em um ambiente `ubuntu-latest`.
* **Passos:**
    1.  `actions/checkout@v4`: Baixa o código.
    2.  `actions/setup-node@v4`: Configura o ambiente Node.js 20.
    3.  `npm ci`: Instala as dependências de forma limpa (mais rápido e seguro que `npm install`).
    4.  `npm test`: Executa a suíte de testes do Vitest.
    5.  `npm run build`: Gera a build de produção para garantir que o projeto está "buildando" corretamente.

---

## 4. 🗂️ Estrutura Detalhada do Projeto

Abaixo está a estrutura completa de todos os 53 arquivos analisados no projeto `src`.

    TCC-Front_Web/
    │
    ├── .github/
    │   └── workflows/
    │       └── ci.yml             # Pipeline de Integração Contínua
    ├── public/
    │   └── favicon.ico.svg        # Ícone da aplicação
    ├── src/
    │   │
    │   ├── assets/
    │   │   ├── Ln QOTA Branca.png # Logo QOTA (versão branca)
    │   │   ├── Ln QOTA.png        # Logo QOTA (versão padrão)
    │   │   └── login.png          # Imagem de fundo da tela de login
    │   │
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── LoginForm.jsx          # Formulário e lógica de login
    │   │   ├── calendar/
    │   │   │   ├── ChecklistForm.jsx      # Formulário de check-in/out
    │   │   │   ├── ChecklistHistory.jsx   # Visualizador de checklists passados
    │   │   │   ├── ReservationModal.jsx   # Modal multi-passo para criar reserva
    │   │   │   ├── RulesHelpModal.jsx     # Modal de ajuda das regras
    │   │   │   └── SchedulingRules.jsx    # Painel de edição das regras (Master)
    │   │   ├── financial/
    │   │   │   ├── AddExpenseModal.jsx    # Modal de despesa (Manual e IA)
    │   │   │   ├── CurrencyInputField.jsx # Input de formatação de moeda
    │   │   │   ├── ExpenseDetailsModal.jsx# Modal de detalhes da despesa
    │   │   │   ├── ExpenseTable.jsx       # Tabela de despesas com paginação
    │   │   │   └── FinancialStats.jsx     # Cards de estatísticas e gráfico
    │   │   ├── inventory/
    │   │   │   ├── InventoryDialogs.jsx   # Diálogo de confirmação de exclusão
    │   │   │   ├── InventoryGalleryModal.jsx # Galeria (lightbox) de fotos do item
    │   │   │   ├── InventoryModal.jsx     # Modal de criação/edição de item
    │   │   │   └── InventorySection.jsx   # Seção completa de inventário
    │   │   ├── layout/
    │   │   │   ├── PublicLayout.jsx       # Layout para páginas públicas (sem sidebar)
    │   │   │   └── Sidebar.jsx            # Barra de navegação lateral
    │   │   ├── members/
    │   │   │   └── InviteMemberModal.jsx  # Modal para convidar novos cotistas
    │   │   ├── property/
    │   │   │   ├── PropertyDialogs.jsx    # Diálogos (Sair/Excluir propriedade)
    │   │   │   └── PropertySections.jsx   # Blocos da página de detalhes (Header, Galeria, Form)
    │   │   ├── ui/
    │   │   │   ├── dialog.jsx             # Componente base de Modal/Diálogo
    │   │   │   ├── FormComponents.jsx     # Biblioteca de inputs (InputField, SelectField, etc.)
    │   │   │   ├── Input.jsx              # Componente de input base estilizado
    │   │   │   └── NotificationComponents.jsx # Sino de notificação e modal
    │   │   └── ProtectedRoute.jsx       # Guardião de rotas autenticadas
    │   │
    │   ├── context/
    │   │   ├── AuthContext.jsx          # Definição do React Context
    │   │   └── AuthProvider.jsx         # Provedor com toda a lógica de autenticação
    │   │
    │   ├── hooks/
    │   │   ├── useAuth.js               # Hook de atalho para o AuthContext
    │   │   └── useUserProperties.js     # Hook para buscar propriedades do usuário
    │   │
    │   ├── pages/
    │   │   ├── AcceptInvitePage.jsx     # Página pública para aceitar convite
    │   │   ├── CalendarPage.css         # Estilos customizados do BigCalendar
    │   │   ├── CalendarPage.jsx         # Orquestrador do módulo de Agenda
    │   │   ├── EditProfile.jsx          # Página de edição de perfil (com corte de foto)
    │   │   ├── FinancialDashboard.jsx   # Orquestrador do módulo Financeiro
    │   │   ├── Home.jsx                 # Dashboard principal (lista de propriedades)
    │   │   ├── LoginPage.jsx            # Página container para o LoginForm
    │   │   ├── PrivacyPolicyPage.jsx    # Página estática de Política de Privacidade
    │   │   ├── PropertyDetails.jsx      # Orquestrador dos detalhes da propriedade
    │   │   ├── PropertyMembersPage.jsx  # Orquestrador do gerenciamento de cotistas
    │   │   ├── RegisterProperty.jsx     # Página de cadastro de propriedade (com IA)
    │   │   ├── RegisterUser.jsx         # Página de cadastro de novo usuário
    │   │   ├── ReservationDetailsPage.jsx # Página de detalhes de uma reserva (check-in/out)
    │   │   └── TermsPage.jsx            # Página estática de Termos de Uso
    │   │
    │   ├── routes/
    │   │   └── paths.js                 # Fonte única da verdade para todas as URLs
    │   │
    │   ├── services/
    │   │   ├── api.js                   # Configuração central do Axios (interceptors)
    │   │   └── propertyService.js       # Funções de API do módulo de propriedade
    │   │
    │   ├── styles/
    │   │   └── tailwind.css             # Importações base do Tailwind
    │   │
    │   ├── App.css
    │   ├── App.jsx                      # Componente Raiz (Rotas, Provider, Toaster)
    │   ├── index.css
    │   ├── main.jsx                     # Ponto de entrada da aplicação
    │   └── setupTests.js                # Configuração do Vitest com jest-dom
    │
    ├── .env                           # (Exemplo) Arquivo de variáveis de ambiente
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js

---

## 5. 🧩 Análise Detalhada dos Módulos (Componentes e Páginas)

Esta seção detalha a responsabilidade de cada página e dos componentes mais importantes.

### 5.1. `src/pages` (As Páginas Orquestradoras)

As páginas atuam como "orquestradores". Elas são responsáveis por buscar dados, gerenciar o estado principal da tela e montar os componentes de UI.

* **`Home.jsx`:** Dashboard do usuário. Usa o hook `useUserProperties` para buscar e exibir a lista de propriedades (`PropertyCard`).
* **`RegisterUser.jsx`:** Página de cadastro. Após o sucesso no `POST /auth/register`, chama a função `login()` do `AuthContext` para autenticar o usuário automaticamente.
* **`AcceptInvitePage.jsx`:** Página pública de convite. Orquestra o fluxo de 3 cenários (aceitar, logar, registrar) com base na resposta da API.
* **`RegisterProperty.jsx`:** Página de cadastro de propriedade. Gerencia um formulário complexo, a API do ViaCEP e o fluxo de validação de endereço por IA.
* **`PropertyDetails.jsx`:** Hub de gerenciamento da propriedade. Busca todos os dados (propriedade, inventário, notificações) e os distribui para os subcomponentes (`PropertyHeader`, `PropertyGallery`, `PropertyDetailsSection`, `InventorySection`).
* **`PropertyMembersPage.jsx`:** Página de gestão de cotistas (Master-only). Gerencia a lógica de edição de permissões, frações e remoção de membros, além de exibir convites pendentes.
* **`FinancialDashboard.jsx`:** Orquestrador do financeiro. Busca todos os dados e gerencia os filtros (separados para stats e tabela) e a abertura de *todos* os modais financeiros.
* **`CalendarPage.jsx`:** Orquestrador da agenda. Configura o `react-big-calendar`, gerencia a lógica de clique (`onSelectSlot`, `onSelectEvent`) e exibe os componentes de regras e listas.
* **`ReservationDetailsPage.jsx`:** Detalhes de *uma* reserva. Gerencia o estado do fluxo de "Check-in vs. Check-out" e exibe o `ChecklistForm` ou `ChecklistHistory` apropriado.
* **`EditProfile.jsx`:** Gerencia o formulário de dados do usuário e o complexo fluxo de upload e recorte de imagem de perfil (`react-image-crop`).

### 5.2. `src/components` (Os Blocos de Construção)

* **`auth/LoginForm.jsx`:**
    * Contém toda a lógica de login.
    * Em caso de sucesso, chama `login()` do `AuthContext` e redireciona.
    * Gerencia o estado de `isLoading` e `statusMessage` para feedback ao usuário.

* **`calendar/`:**
    * **`ReservationModal.jsx`:** Modal multi-passo (stepper) para criar uma reserva. Valida as regras da propriedade (dias min/max) e o saldo de diárias do usuário.
    * **`ChecklistForm.jsx`:** Formulário de checklist. É reutilizado para "CHECKIN" e "CHECKOUT". Exige observação se um item for marcado como "Desgastado" ou "Danificado".
    * **`SchedulingRules.jsx`:** Painel (usado na `CalendarPage`) que permite ao Master editar as regras da propriedade (min/max dias, horários, etc.).

* **`financial/`:**
    * **`AddExpenseModal.jsx`:** Modal complexo com duas abas. A aba "Enviar Comprovante (IA)" usa o `POST /financial/ocr-process` para pré-preencher o formulário, que é então confirmado na aba "Cadastro Manual".
    * **`ExpenseTable.jsx`:** Tabela reutilizável com paginação. Inclui um `ActionMenu` (dropdown) complexo que se reposiciona dinamicamente para evitar cortar na tela.
    * **`ExpenseDetailsModal.jsx`:** Modal que busca os detalhes de uma despesa, incluindo a lista de pagamentos por cotista. Implementa **atualização otimista** ao trocar o status de pagamento (a UI muda instantaneamente, antes da resposta da API).
    * **`FinancialStats.jsx`:** Renderiza os cards de "Visão Geral" e o gráfico de barras (`recharts`).

* **`inventory/`:**
    * **`InventorySection.jsx`:** Orquestrador que exibe a tabela de inventário e gerencia a abertura dos modais.
    * **`InventoryModal.jsx`:** Modal de CRUD para itens. Gerencia o upload de até 6 fotos por item.
    * **`InventoryGalleryModal.jsx`:** Galeria (lightbox) para visualizar as fotos de um item, com navegação por teclado (Setas/Esc).

* **`property/PropertySections.jsx`:**
    * **`PropertyDetailsSection`:** Componente mais complexo deste módulo. Gerencia o estado de `isEditing`. No modo de edição, exibe um formulário completo e implementa a lógica de validação de comprovante de endereço.
    * **`PropertyGallery`:** Galeria principal da propriedade, com carrossel e "dots" de navegação.

* **`ui/` (Biblioteca Base):**
    * **`dialog.jsx`:** O componente de modal mais fundamental. Fornece o overlay, o botão de fechar e a lógica de fechar com 'Esc' ou clique fora.
    * **`FormComponents.jsx`:** Padroniza todos os formulários da aplicação (`InputField`, `SelectField`, `FileInput`, `FilePreview`). O `FilePreview` gerencia a exibição de uploads (com status de validação) e a exclusão de fotos.

---

## 6. 🚦 Fluxos de Negócio Críticos (Passo a Passo)

Esta seção detalha os fluxos de lógica de negócio mais complexos, essenciais para a manutenção.

### 6.1. Fluxo: Cadastro de Propriedade (com Validação de IA)

**Página:** `RegisterProperty.jsx`

1.  Usuário preenche os dados básicos (nome, tipo, frações).
2.  Usuário preenche o CEP (ex: "38400-000").
3.  Um `useEffect` detecta o CEP de 8 dígitos e dispara uma busca `axios.get` na API do **ViaCEP**.
4.  Se sucesso, os campos de Logradouro, Bairro e Cidade são preenchidos automaticamente.
5.  Usuário preenche o Número.
6.  Usuário faz upload de um **PDF** (Comprovante de Endereço).
7.  A função `handleDocumentChange` é disparada. Ela define `documentStatus: 'validating'`.
8.  Uma requisição `POST /validation/address` é enviada para a API do QOTA, contendo o PDF e os dados de endereço digitados.
9.  A API (back-end) usa OCR para ler o PDF, compara com o endereço fornecido e retorna:
    * **Sucesso (200):** `documentStatus` vira `success`. O botão "Cadastrar Propriedade" é **habilitado**.
    * **Falha (4xx):** `documentStatus` vira `error`. O botão permanece desabilitado e uma mensagem de erro é exibida.
10. Usuário clica em "Cadastrar":
    * `POST /property/create` é enviado com os dados do formulário.
    * A API retorna o `propertyId`.
    * `POST /propertyDocuments/upload` (para o comprovante) e `POST /propertyPhoto/upload` (para as fotos) são enviados em paralelo, usando o `propertyId` recebido.

### 6.2. Fluxo: Convite de Membro (3 Cenários)

**Página:** `AcceptInvitePage.jsx`

1.  Usuário acessa a URL pública: `/convite/some-token-jwt`.
2.  O `useEffect` da página dispara `GET /invite/verify/:token`.
3.  A API verifica o token e retorna os detalhes do convite, incluindo um booleano `userExists` (indicando se o e-mail do convite já possui uma conta QOTA).
4.  A página renderiza condicionalmente com base em `userExists` e no `useAuth()`:
    * **Cenário 1: Usuário já está logado (`usuario != null`)**
        * A página exibe o botão **"Aceitar Convite"**.
        * Clique -> `POST /invite/accept/:token` (API valida se o usuário logado é o mesmo do convite) -> Redireciona para `/home`.
    * **Cenário 2: Usuário não logado, mas conta existe (`usuario == null` e `userExists: true`)**
        * A página exibe o botão **"Fazer Login para Aceitar"**.
        * Usuário é enviado para `/login`, faz o login, e é redirecionado de volta para a página de convite (agora caindo no Cenário 1).
    * **Cenário 3: Usuário não logado, conta não existe (`usuario == null` e `userExists: false`)**
        * A página exibe o botão **"Criar Conta para Aceitar"**.
        * Usuário é enviado para `/cadastro` para criar sua conta.

### 6.3. Fluxo: Reserva e Check-in/Check-out

**Páginas:** `CalendarPage.jsx`, `ReservationDetailsPage.jsx`

1.  **Criação (`CalendarPage.jsx`):**
    * Usuário clica em um dia livre no `react-big-calendar` (`onSelectSlot`).
    * A função `handleSelectSlot` verifica se a data não está no passado e se não está "dentro" de uma reserva existente (o dia do check-out é considerado livre).
    * O `ReservationModal` é aberto.
    * O modal valida se a duração da estadia (`differenceInDays`) está entre `minStay` e `maxStay` (das regras) e se a duração é menor ou igual ao `saldoDiarias` do usuário.
    * Se válido, `POST /calendar/reservation` é enviado.
2.  **Visualização (`ReservationDetailsPage.jsx`):**
    * Usuário clica na reserva no calendário, sendo navegado para `/reservation/:id`.
    * A página busca os dados da reserva e o inventário da propriedade.
3.  **Check-in:**
    * Se `canCheckin` for `true` (usuário é o dono, status é 'CONFIRMADA', não há check-in prévio):
    * O `ChecklistForm` (modo "CHECKIN") é renderizado.
    * **Bloqueio:** Se `inventory.length === 0`, o formulário é substituído por um aviso, impedindo o check-in.
    * Usuário preenche o checklist e submete -> `POST /calendar/checkin`.
4.  **Check-out:**
    * Se `canCheckout` for `true` (check-in já foi feito, mas check-out não):
    * O botão "Realizar Check-out" é exibido.
    * Ao clicar, a página rola para o `ChecklistForm` (modo "CHECKOUT").
    * Usuário preenche e submete -> `POST /calendar/checkout`. O status da reserva muda para 'CONCLUIDA'.

### 6.4. Fluxo: Cadastro de Despesa (com IA)

**Componente:** `AddExpenseModal.jsx` (aberto pela `FinancialDashboard.jsx`)

1.  Usuário (Master) clica em "Registrar Nova Despesa" e abre o modal.
2.  Usuário seleciona a aba **"Enviar Comprovante (IA)"**.
3.  Usuário faz upload de um PDF (ex: conta de luz).
4.  A função `handleOcrFileChange` envia o arquivo para `POST /financial/ocr-process`.
5.  A API (back-end) usa OCR para extrair `valor_total`, `data_vencimento` e `categoria`.
6.  O modal recebe os dados e atualiza seu estado interno (`setFormData`), formatando os valores (ex: `123.45` -> "123,45").
7.  O modal **automaticamente muda para a aba "Cadastro Manual"**.
8.  O usuário agora vê o formulário pré-preenchido, onde pode corrigir ou confirmar os dados extraídos pela IA.
9.  Ao clicar em "Registrar Despesa", a submissão final (`handleSubmit`) é feita.

---

## 7. 🧪 Testes

O projeto está configurado com **Vitest** e **React Testing Library**.

* **Configuração:** `vite.config.js` define `environment: 'jsdom'`. `setupTests.js` importa `@testing-library/jest-dom` para adicionar matchers (ex: `.toBeInTheDocument()`).
* **Testes Implementados:**
    * **`AcceptInvitePage.test.jsx`:** Testa a renderização condicional da página de convite, mockando a resposta da API e o `AuthContext` para validar os 3 cenários de usuário (logado, não logado/existente, não logado/novo).

---

## 8. 🗺️ Endpoints da API (Mapeamento)

Esta é uma lista consolidada dos endpoints da API consumidos pelo front-end:

| Módulo | Endpoint | Método | Descrição |
| :--- | :--- | :--- | :--- |
| **Autenticação** | `/auth/login` | `POST` | Autentica o usuário e retorna JWT. |
| | `/auth/register` | `POST` | Cria um novo usuário e retorna JWT. |
| | `/auth/refresh` | `POST` | Restaura a sessão via httpOnly cookie. |
| | `/auth/logout` | `POST` | Invalida o refresh token no back-end. |
| **Usuário** | `/user/:id` | `PUT` | Atualiza o perfil do usuário (nome, foto). |
| | `/user/:id` | `DELETE`| Encerra (anonimiza) a conta do usuário. |
| **Propriedade** | `/property/create` | `POST` | Cria uma nova propriedade. |
| | `/property/:id` | `GET` | Busca detalhes de uma propriedade. |
| | `/property/:id` | `PUT` | Atualiza os dados de uma propriedade. |
| | `/property/:id` | `DELETE`| Exclui (soft delete) uma propriedade. |
| | `/propertyDocuments/upload`| `POST` | Upload do comprovante de endereço. |
| | `/propertyPhoto/upload` | `POST` | Upload de fotos da galeria da propriedade. |
| | `/propertyPhoto/:id` | `DELETE`| Exclui uma foto da galeria. |
| **Permissões** | `/permission/user/:id/properties` | `GET` | Lista as propriedades de um usuário (para a Home). |
| | `/permission/unlink/me/:id` | `DELETE`| Permite ao usuário logado sair de uma propriedade. |
| | `/permission/unlink/member/:id`| `DELETE`| (Master) Remove outro membro da propriedade. |
| | `/permission/:id` | `PUT` | (Master) Altera a permissão (Master/Comum). |
| | `/permission/cota/:id` | `PUT` | (Master) Altera o nº de frações de um membro. |
| **Convites** | `/invite` | `POST` | (Master) Cria um novo convite. |
| | `/invite/property/:id/pending`| `GET` | (Master) Lista convites pendentes. |
| | `/invite/verify/:token` | `GET` | (Público) Verifica a validade de um token de convite. |
| | `/invite/accept/:token` | `POST` | (Logado) Aceita um convite. |
| **Financeiro** | `/financial/property/:id` | `GET` | Lista as despesas (paginado). |
| | `/financial/property/:id/summary` | `GET` | Busca dados para os cards e gráfico. |
| | `/financial/property/:id/report` | `GET` | Gera o relatório financeiro em PDF. |
| | `/financial/expense/manual` | `POST` | Cria uma nova despesa. |
| | `/financial/expense/:id` | `GET`, `PUT`, `DELETE` | CRUD de uma despesa. |
| | `/financial/expense/:id/mark-all-paid` | `PUT` | (Master) Marca todos pagamentos de uma despesa. |
| | `/financial/payment/:id` | `PUT` | Atualiza o status (pago/pendente) de um cotista. |
| | `/financial/ocr-process` | `POST` | Envia PDF para extração de dados via IA. |
| **Calendário** | `/calendar/property/:id` | `GET` | Lista as reservas (eventos) do calendário. |
| | `/calendar/property/:id/penalties`| `GET` | Lista penalidades ativas. |
| | `/calendar/property/:id/upcoming` | `GET` | Lista próximas reservas (widget). |
| | `/calendar/property/:id/completed` | `GET` | Lista reservas concluídas (widget). |
| | `/calendar/reservation` | `POST` | Cria uma nova reserva. |
| | `/calendar/reservation/:id` | `GET`, `DELETE` | CRUD de uma reserva. |
| | `/calendar/checkin` | `POST` | Realiza o check-in (com checklist). |
| | `/calendar/checkout` | `POST` | Realiza o check-out (com checklist). |
| | `/calendar/rules/:id` | `PUT` | (Master) Atualiza as regras da agenda. |
| **Inventário** | `/inventory/property/:id` | `GET` | Lista todos os itens de inventário. |
| | `/inventory/create` | `POST` | Cria um novo item de inventário. |
| | `/inventory/:id` | `GET`, `PUT`, `DELETE`| CRUD de um item de inventário. |
| | `/inventoryPhoto/upload` | `POST` | Upload de foto de um item. |
| | `/inventoryPhoto/:id` | `DELETE`| Exclui foto de um item. |
| **Notificações** | `/notification/property/:id`| `GET` | Lista notificações da propriedade. |
| | `/notification/read` | `PUT` | Marca notificações como lidas. |
| **Validação** | `/validation/address` | `POST` | Valida comprovante de endereço (PDF) via IA. |