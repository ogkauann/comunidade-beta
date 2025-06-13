const Room = require('../models/Room');
const User = require('../models/User');
const Message = require('../models/Message');

const roomService = {
  createRoom: async (name, description, type, creatorId) => {
    try {
      // Garante que o criador é um membro da sala por padrão
      const room = new Room({ name, description, type, creator: creatorId, members: [creatorId] });
      await room.save();
      return room;
    } catch (error) {
      throw new Error(`Erro ao criar sala: ${error.message}`);
    }
  },

  getRooms: async (userId) => {
    try {
      // Retorna salas públicas e salas privadas das quais o usuário é membro
      const rooms = await Room.find({
        $or: [
          { type: 'public' },
          { type: 'private', members: userId }
        ]
      }).populate('creator', 'nome email').populate('members', 'nome email');
      return rooms;
    } catch (error) {
      throw new Error(`Erro ao buscar salas: ${error.message}`);
    }
  },

  getRoomById: async (roomId) => {
    try {
      const room = await Room.findById(roomId).populate('creator', 'nome email').populate('members', 'nome email');
      if (!room) {
        throw new Error('Sala não encontrada.');
      }
      return room;
    } catch (error) {
      throw new Error(`Erro ao buscar sala por ID: ${error.message}`);
    }
  },

  joinRoom: async (roomId, userId) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Sala não encontrada.');
      }
      if (!room.members.includes(userId)) {
        room.members.push(userId);
        await room.save();
      }
      return room;
    } catch (error) {
      throw new Error(`Erro ao entrar na sala: ${error.message}`);
    }
  },

  leaveRoom: async (roomId, userId) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Sala não encontrada.');
      }
      room.members = room.members.filter(member => member.toString() !== userId.toString());
      await room.save();
      return room;
    } catch (error) {
      throw new Error(`Erro ao sair da sala: ${error.message}`);
    }
  },

  getRoomMessages: async (roomId, userId) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Sala não encontrada.');
      }
      // Apenas membros podem ver mensagens de salas privadas e MDs
      if ((room.type === 'private' || room.isDirectMessage) && !room.members.includes(userId)) {
        throw new Error('Acesso negado. Você não é membro desta sala privada/MD.');
      }
      const messages = await Message.find({ chatId: roomId })
        .populate('remetente', 'nome email')
        .sort({ timestamp: 1 });
      return messages;
    } catch (error) {
      throw new Error(`Erro ao buscar mensagens da sala: ${error.message}`);
    }
  },

  findOrCreateDirectMessageRoom: async (user1Id, user2Id) => {
    try {
      // Ordenar IDs para garantir consistência na busca
      const members = [user1Id, user2Id].sort();

      let room = await Room.findOne({
        isDirectMessage: true,
        type: 'private',
        members: { $all: members, $size: 2 }
      });

      if (!room) {
        // Criar uma nova sala de MD se não existir
        room = new Room({
          name: `DM_${user1Id}_${user2Id}`,
          description: 'Sala de Mensagem Direta',
          type: 'private',
          isDirectMessage: true,
          members: members,
          creator: user1Id // O primeiro usuário a iniciar a DM é o criador
        });
        await room.save();
      }
      return room;
    } catch (error) {
      throw new Error(`Erro ao buscar ou criar sala de MD: ${error.message}`);
    }
  }
};

module.exports = roomService; 