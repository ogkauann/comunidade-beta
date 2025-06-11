# Comunidade Chat

Sistema de chat em tempo real para comunidades, com foco em colaboração e troca de ideias.

## 🚀 Funcionalidades

- Chat em tempo real para ideias
- Salas de chat temáticas
- Chat privado entre usuários
- Sistema de presença online
- Upload de arquivos e imagens
- Suporte a código com syntax highlighting
- Reações e respostas a mensagens

## 🛠️ Tecnologias

- Backend: Node.js + Express
- Frontend: React + Vite
- WebSocket: Socket.io
- Banco de Dados: MongoDB
- Autenticação: JWT

## 📋 Pré-requisitos

- Node.js (v14+)
- MongoDB
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd comunidade-chat
```

2. Instale as dependências do backend:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/comunidade-chat
JWT_SECRET=sua_chave_secreta_aqui
```

4. Instale as dependências do frontend:
```bash
cd client
npm install
```

## 🚀 Executando o projeto

1. Inicie o servidor:
```bash
npm run dev
```

2. Em outro terminal, inicie o cliente:
```bash
npm run client
```

3. Acesse `http://localhost:5173` no navegador

## 📝 Estrutura do Projeto

```
comunidade-chat/
├── src/
│   ├── models/
│   │   ├── User.js
│   │   ├── Idea.js
│   │   └── Message.js
│   └── server.js
├── client/
│   └── [arquivos do frontend]
├── .env
└── package.json
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request 