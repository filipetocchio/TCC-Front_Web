# QOTA - Sistema de Gestão de Propriedades Compartilhadas (Front-End)

---

## 📘 Introdução

Este repositório contém o front-end do sistema **QOTA**, uma aplicação web moderna desenvolvida para facilitar o **cadastro, gerenciamento e visualização de propriedades compartilhadas**, incluindo funcionalidades como controle de usuários, permissões, documentos e visualização detalhada de propriedades.

O projeto foi construído com um stack tecnológico moderno, que visa **performance, escalabilidade e uma experiência de usuário refinada**:

### 🛠️ Tecnologias Utilizadas

| Tecnologia        | Descrição |
|-------------------|-----------|
| **React**         | Biblioteca JavaScript moderna para criação de interfaces reativas e componentes reutilizáveis. Utilizamos a versão com Hooks e Context API para gerenciamento de estado global. |
| **Vite**          | Ferramenta de build extremamente rápida para projetos front-end modernos. Proporciona reload instantâneo e configuração simplificada. |
| **Tailwind CSS**  | Framework de utilitários CSS para construção de interfaces elegantes e responsivas com velocidade e consistência. |
| **React Router DOM** | Permite navegação entre páginas (SPA) sem recarregar a página, com rotas dinâmicas e aninhadas. |
| **Context API**   | Gerencia estados globais como autenticação sem dependências externas. |
| **Axios ou Fetch**| Abstração de chamadas HTTP à API RESTful, centralizando a comunicação com o back-end. |

---

## 📁 Estrutura de Pastas e Arquivos

```
TCC-Front_Web-main/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles/
│   │   └── tailwind.css
│   ├── routes/
│   │   └── paths.js
│   ├── utils/
│   │   └── api.js
│   ├── context/
│   │   └── AuthProvider.jsx
│   ├── hooks/
│   │   └── useAuth.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── Home.jsx
│   │   ├── RegisterUser.jsx
│   │   ├── RegisterProperty.jsx
│   │   ├── EditProfile.jsx
│   │   └── PropertyDetails.jsx
│   └── components/
│       └── Sidebar.jsx
```

---

## 📄 Descrição dos Arquivos

### 📌 Arquivos Globais

- **index.html**  
  Página HTML raiz com o `div#root` onde a aplicação React é montada.

- **vite.config.js**  
  Configura Vite com alias `@` para simplificar imports e define a porta de desenvolvimento como 3000.

- **tailwind.config.js**  
  Define a paleta de cores personalizada, incluindo o dourado corporativo, e gradientes utilizados na identidade visual da aplicação.

---

### 🔁 Inicialização e Setup

- **src/main.jsx**  
  Ponto de entrada da aplicação. Carrega o `App` e aplica o modo estrito (`React.StrictMode`).

- **src/App.jsx**  
  Define a estrutura de rotas da aplicação com React Router e envolve os componentes no `AuthProvider`.

---

### 🧠 Gerenciamento de Estado

- **context/AuthProvider.jsx**  
  Responsável por manter o estado de autenticação, armazenando token, usuário logado e funções para login/logout. Permite o compartilhamento de dados entre todos os componentes.

- **hooks/useAuth.jsx**  
  Hook customizado que fornece acesso ao contexto de autenticação de forma simplificada.

---

### 🌐 Rotas

- **routes/paths.js**  
  Centraliza as definições das rotas para facilitar mudanças e evitar repetições no código.

---

### 🔌 Utilitários

- **utils/api.js**  
  Configuração centralizada de comunicação HTTP com o back-end via fetch ou axios, com base URL e headers prontos para uso.

---

### 🖼️ Páginas (Pages)

- **LoginPage.jsx**  
  Formulário de login com autenticação contra a API. Atualiza o contexto global ao logar.

- **Home.jsx**  
  Página inicial após login. Lista todas as propriedades vinculadas ao usuário autenticado com visual agradável, ícones e botão de gerenciamento.

- **RegisterUser.jsx**  
  Página de cadastro de novos usuários. Envia os dados para a API, com validações e feedback visual.

- **RegisterProperty.jsx**  
  Formulário para cadastrar novas propriedades, incluindo upload de fotos e documentos.

- **EditProfile.jsx**  
  Permite que o usuário edite suas informações e imagem de perfil. Atualiza os dados no back-end via API.

- **PropertyDetails.jsx**  
  Exibe todos os dados da propriedade selecionada, imagens, documentos e oferece botões para acessar módulos relacionados (financeiro, agenda, inventário, cotistas). Botões de **editar** e **excluir** visíveis apenas para o usuário master.

---

### 🧩 Componentes

- **Sidebar.jsx**  
  Barra lateral responsiva com links de navegação e avatar do usuário. Presente em páginas internas.

---

## 🚀 Como Executar o Projeto

```bash
# Clonar o repositório
git clone <URL-do-repositório>

# Entrar na pasta
cd TCC-Front_Web-main

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

---

## ✅ Funcionalidades Desenvolvidas Até o Momento

O sistema QOTA já possui as seguintes funcionalidades concluídas no front-end:

- **Autenticação**: login e logout com armazenamento de token.
- **Cadastro de novos usuários.**
- **Cadastro de propriedades** com upload de imagens e documentos.
- **Visualização das propriedades do usuário** na página inicial.
- **Página de detalhes de cada propriedade** com estilo profissional e informações completas.
- **Edição e exclusão de propriedade (apenas pelo usuário master).**
- **Edição de perfil e foto do usuário.**
- **Sidebar de navegação persistente nas páginas internas.**

---

## 🧭 Próximos Passos

Este front-end está em **desenvolvimento contínuo**. Futuras melhorias e funcionalidades serão implementadas, incluindo:

- Módulo de **controle financeiro da propriedade**.
- **Agenda compartilhada** para eventos e reservas.
- **Gestão de cotistas** (proprietários secundários).
- **Inventário de bens** da propriedade.
- **Responsividade total para mobile e tablet**.
- **Melhorias de acessibilidade e usabilidade.**

---

## 🧩 Conclusão

O front-end do **QOTA** foi desenvolvido com foco em **qualidade visual, arquitetura modular e boas práticas de programação**, visando facilitar a gestão de propriedades compartilhadas por meio de uma interface intuitiva e moderna.  

Esta documentação representa o estado atual do projeto e será atualizada à medida que novas funcionalidades forem implementadas.

---
