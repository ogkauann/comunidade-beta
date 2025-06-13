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

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: logger.stream }));
app.use(apiLimiter);

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('Conectado ao MongoDB'))
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

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Autenticação necessária: Token não fornecido.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error('Autenticação necessária: Usuário não encontrado.'));
    }

    socket.user = user;
    socket.userId = user._id.toString();
    socket.token = token;
    socket.userName = user.nome;

    next();
  } catch (error) {
    return next(new Error('Autenticação necessária: Token inválido ou expirado.'));
  }
});

io.on('connection', (socket) => {
  logger.info('Novo usuário conectado:', socket.id, 'Nome:', socket.userName);

  socket.on('join_room', async (roomId) => {
    socket.join(roomId);
    logger.info(`Usuário ${socket.userName} (${socket.id}) entrou na sala ${roomId}`);

    try {
      await StatisticsService.atualizarEstatisticas(socket.userId, 'entrada_sala');
      const messages = await roomService.getRoomMessages(roomId, socket.userId);
      socket.emit('historical_messages', messages);
    } catch (error) {
      logger.error('Erro ao atualizar estatísticas:', error);
    }
  });

  socket.on('send_message', async (data) => {
    try {
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
          chatId: data.roomId,
          remetente: socket.userId,
          mensagem: data.message,
          tipo: 'texto'
        })
      });
      
      const savedMessage = await response.json();
      
      io.to(data.roomId).emit('receive_message', {
        ...savedMessage,
        remetente: { _id: socket.userId, nome: socket.userName },
        timestamp: new Date()
      });

      await NotificationService.notificarNovaMensagem(
        { _id: data.roomId, titulo: data.roomTitle },
        savedMessage
      );

      await StatisticsService.atualizarEstatisticas(socket.userId, 'mensagem');
    } catch (error) {
      logger.error('Erro ao processar mensagem:', error);
      socket.emit('error', { message: 'Erro ao enviar mensagem' });
    }
  });

  socket.on('typing', (data) => {
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
    logger.info('Usuário desconectado:', socket.id, 'Nome:', socket.userName);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
}); 