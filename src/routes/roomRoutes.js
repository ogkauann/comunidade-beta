const express = require('express');
const router = express.Router();
const roomService = require('../services/roomService');
const auth = require('../middleware/auth'); // Assumindo que você tem um middleware de autenticação

// Rota para criar uma nova sala
router.post('/rooms', auth, async (req, res) => {
  try {
    const { name, description, type } = req.body;
    if (!name) {
      return res.status(400).json({ msg: 'O nome da sala é obrigatório.' });
    }
    const room = await roomService.createRoom(name, description, type, req.user.id);
    res.status(201).json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro do servidor');
  }
});

// Rota para listar salas
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await roomService.getRooms(req.user.id);
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro do servidor');
  }
});

// Rota para obter uma sala específica por ID
router.get('/rooms/:id', auth, async (req, res) => {
  try {
    const room = await roomService.getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ msg: 'Sala não encontrada' });
    }
    // Verificar se o usuário tem permissão para acessar a sala privada
    if (room.type === 'private' && !room.members.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Acesso negado. Você não é membro desta sala privada.' });
    }
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro do servidor');
  }
});

// Rota para entrar em uma sala
router.post('/rooms/:id/join', auth, async (req, res) => {
  try {
    const room = await roomService.joinRoom(req.params.id, req.user.id);
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro do servidor');
  }
});

// Rota para sair de uma sala
router.post('/rooms/:id/leave', auth, async (req, res) => {
  try {
    const room = await roomService.leaveRoom(req.params.id, req.user.id);
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro do servidor');
  }
});

// Rota para encontrar ou criar uma sala de mensagem direta
router.post('/rooms/direct', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ msg: 'O ID do usuário alvo é obrigatório.' });
    }

    const room = await roomService.findOrCreateDirectMessageRoom(req.user.id, targetUserId);
    res.status(200).json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro do servidor');
  }
});

module.exports = router; 