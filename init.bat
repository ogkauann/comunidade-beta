@echo off
echo Iniciando configuracao do projeto Comunidade Chat...

echo Instalando dependencias do backend...
npm install

echo Instalando dependencias do frontend...
cd client
npm install
cd ..

echo Criando arquivo .env...
echo PORT=3000 > .env
echo MONGODB_URI=mongodb://localhost:27017/comunidade-chat >> .env
echo JWT_SECRET=chave_secreta_temporaria >> .env

echo Configuracao concluida!
echo.
echo Para iniciar o projeto:
echo 1. Certifique-se de que o MongoDB esta rodando
echo 2. Execute 'npm run dev' para iniciar o backend
echo 3. Em outro terminal, execute 'cd client && npm run dev' para iniciar o frontend
echo.
echo Acesse http://localhost:5173 no navegador 