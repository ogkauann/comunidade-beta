const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');

const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimit');
const NotificationService = require('./services/NotificationService');
const ModerationService = require('./services/ModerationService');
const StatisticsService = require('./services/StatisticsService');
const roomService = require('./services/roomService');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    logger.info('Conectado ao MongoDB');
    // Garante que a sala 'general' existe
    Room.findOne({ name: 'general' })
      .then(async generalRoom => {
        if (!generalRoom) {
          logger.info('Sala \'general\' não encontrada. Tentando criar...');
          let creatorId;
          try {
            // Tenta encontrar um usuário existente para ser o criador da sala
            const existingUser = await User.findOne({}); // Pega o primeiro usuário encontrado
            if (existingUser) {
              creatorId = existingUser._id;
              logger.info(`Usando usuário existente ${existingUser.nome} como criador da sala \'general\'.`);
            } else {
              // Fallback se não houver usuários (pode causar erro se creator for required)
              // Em um ambiente de produção, um usuário admin deveria ser criado manualmente ou via script
              creatorId = new mongoose.Types.ObjectId();
              logger.warn('Nenhum usuário encontrado. Criando sala \'general\' com ID de criador temporário. Considere criar um usuário administrador válido.');
            }
          } catch (findUserError) {
            logger.error('Erro ao buscar usuário para criador da sala general:', findUserError);
            creatorId = new mongoose.Types.ObjectId(); // Fallback em caso de erro
          }

          const room = new Room({
            name: 'general',
            description: 'Sala geral para discussões abertas.',
            type: 'public',
            creator: creatorId,
            members: []
          });
          room.save()
            .then(() => logger.info('Sala \'general\' criada com sucesso.'))
            .catch(err => logger.error('Erro ao criar sala \'general\':', err));
        } else {
          logger.info('Sala \'general\' já existe.');
        }
      })
      .catch(err => logger.error('Erro ao verificar sala \'general\':', err));
  })
  .catch(err => logger.error('Erro ao conectar ao MongoDB:', err));

// Rotas
const authRouter = require('./routes/auth');
const ideasRouter = require('./routes/ideas');
const messagesRouter = require('./routes/messages');
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('Socket Auth Middleware: Token recebido?', !!token);

    if (!token) {
      console.log('Socket Auth Middleware: Token não fornecido.');
      return next(new Error('Token não fornecido'));
    }

    console.log('Socket Auth Middleware: JWT_SECRET do servidor:', process.env.JWT_SECRET ? 'Definido' : 'NÃO DEFINIDO');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Socket Auth Middleware: Token decodificado:', decoded);

    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('Socket Auth Middleware: Usuário NÃO encontrado para ID:', decoded.userId);
      return next(new Error('Usuário não encontrado'));
    }

    console.log('Socket Auth Middleware: Usuário encontrado:', user.nome);
    socket.userId = user._id;
    socket.userName = user.nome;
    socket.token = token;
    next();
  } catch (error) {
    console.error('Socket Auth Middleware: Erro durante autenticação:', error.message);
    next(new Error('Autenticação falhou'));
  }
});

// Função auxiliar para verificar se uma string é um ObjectId válido
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

io.on('connection', (socket) => {
  logger.info('Novo usuário conectado:', socket.id, 'Nome:', socket.userName);

  socket.on('join_room', async (roomIdFromClient) => {
    let actualRoomId = roomIdFromClient;
    let roomName = null;

    try {
      let room = null;
      if (isValidObjectId(roomIdFromClient)) {
        room = await Room.findById(roomIdFromClient);
      } else {
        // Se não for um ObjectId, assume que é o nome da sala
        roomName = roomIdFromClient;
        room = await Room.findOne({ name: roomIdFromClient });
      }

      if (!room) {
        logger.warn(`Sala ${roomIdFromClient} não encontrada.`);
        socket.emit('error', { message: `Sala ${roomIdFromClient} não encontrada.` });
        return;
      }
      actualRoomId = room._id.toString();
      roomName = room.name; // Garante que temos o nome da sala

      socket.join(actualRoomId);
      logger.info(`Usuário ${socket.userName} (${socket.id}) entrou na sala ${roomName} (${actualRoomId})`);

      // Envia mensagem de sistema quando um usuário entra na sala
      io.to(actualRoomId).emit('receive_message', {
        _id: new mongoose.Types.ObjectId(),
        chatId: actualRoomId,
        remetente: { _id: 'system', nome: 'Sistema' },
        mensagem: `${socket.userName} entrou na sala`,
        tipo: 'sistema',
        timestamp: new Date()
      });

      await StatisticsService.atualizarEstatisticas(socket.userId, 'entrada_sala');
      const messages = await roomService.getRoomMessages(actualRoomId, socket.userId);
      socket.emit('historical_messages', messages);
    } catch (error) {
      logger.error('Erro ao entrar na sala ou buscar mensagens históricas:', error);
      socket.emit('error', { message: 'Erro ao entrar na sala.' });
    }
  });

  socket.on('send_message', async (data) => {
    let actualRoomId = data.roomId; // roomId vem do cliente
    let roomName = null;
    
    try {
      if (!isValidObjectId(data.roomId)) {
        // Se não for um ObjectId, tenta encontrar a sala pelo nome
        const room = await Room.findOne({ name: data.roomId });
        if (room) {
          actualRoomId = room._id.toString();
          roomName = room.name;
        } else {
          logger.warn(`Sala ${data.roomId} não encontrada para envio de mensagem.`);
          socket.emit('error', { message: `Sala ${data.roomId} não encontrada.` });
          return;
        }
      } else {
        // Se for um ObjectId, busca a sala para obter o nome
        const room = await Room.findById(data.roomId);
        if (room) {
          roomName = room.name;
        }
      }

      const conteudoInapropriado = await ModerationService.verificarConteudo(data.message);
      if (conteudoInapropriado) {
        socket.emit('error', { message: 'Conteúdo inapropriado detectado' });
        return;
      }

      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${socket.token}`
        },
        body: JSON.stringify({
          chatId: actualRoomId,
          remetente: socket.userId,
          mensagem: data.message,
          tipo: 'texto'
        })
      });
      
      const savedMessage = await response.json();
      
      io.to(actualRoomId).emit('receive_message', {
        ...savedMessage,
        remetente: { _id: socket.userId, nome: socket.userName }
      });

      await NotificationService.notificarNovaMensagem(
        { _id: actualRoomId, titulo: roomName || 'Sala de Chat' },
        savedMessage
      );

      await StatisticsService.atualizarEstatisticas(socket.userId, 'mensagem');
    } catch (error) {
      logger.error('Erro ao processar mensagem:', error);
      socket.emit('error', { message: 'Erro ao enviar mensagem' });
    }
  });

  socket.on('typing', (data) => {
    // A lógica de tipagem já foi atualizada no frontend para enviar o currentRoomId
    // mas para robustez, poderíamos validar aqui também se necessário.
    socket.to(data.roomId).emit('user_typing', {
      userId: socket.userId,
      userName: socket.userName,
      isTyping: data.isTyping
    });
  });

  socket.on('reaction', async (data) => {
    try {
      const response = await fetch(`http://localhost:3000/api/messages/${data.messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${socket.token}`
        },
        body: JSON.stringify({
          usuario: socket.userId,
          emoji: data.emoji
        })
      });

      const updatedMessage = await response.json();
      io.to(data.roomId).emit('message_updated', updatedMessage);

      await NotificationService.notificarReacao(
        updatedMessage,
        { _id: socket.userId, nome: socket.userName },
        data.emoji
      );

      await StatisticsService.atualizarEstatisticas(updatedMessage.remetente, 'reacao');
    } catch (error) {
      logger.error('Erro ao processar reação:', error);
      socket.emit('error', { message: 'Erro ao adicionar reação' });
    }
  });

  socket.on('report_message', async (data) => {
    try {
      await ModerationService.reportarMensagem(
        data.messageId,
        socket.userId,
        data.motivo
      );
      socket.emit('report_success', { message: 'Denúncia enviada com sucesso' });
    } catch (error) {
      logger.error('Erro ao reportar mensagem:', error);
      socket.emit('error', { message: 'Erro ao enviar denúncia' });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Usuário desconectado:', socket.id);
    // Envia mensagem de sistema quando um usuário sai da sala
    if (socket.rooms.size > 1) { // Verifica se o socket está em alguma sala além da sala padrão
      const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      rooms.forEach(roomId => {
        io.to(roomId).emit('receive_message', {
          _id: new mongoose.Types.ObjectId(),
          chatId: roomId,
          remetente: { _id: 'system', nome: 'Sistema' },
          mensagem: `${socket.userName} saiu da sala`,
          tipo: 'sistema',
          timestamp: new Date()
        });
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
}); 