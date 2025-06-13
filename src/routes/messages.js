const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
const Room = require('../models/Room'); // Importar o modelo Room
const mongoose = require('mongoose'); // Importar mongoose
const validateMessage = require('../middleware/validateMessage')
const auth = require('../middleware/auth')
const { messageLimiter } = require('../middleware/rateLimit'); // Importar messageLimiter

// Função auxiliar para verificar se uma string é um ObjectId válido
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Middleware de autenticação para todas as rotas
router.use(auth)

// Listar mensagens de uma sala com paginação
router.get('/:chatId', messageLimiter, async (req, res, next) => {
  try {
    let actualChatId = req.params.chatId;
    console.log('DEBUG: Initial chatId in messages.js GET /:chatId:', actualChatId);
    console.log('DEBUG: isValidObjectId(actualChatId) (initial):', isValidObjectId(actualChatId));

    // Se o chatId não for um ObjectId válido, tente encontrá-lo pelo nome
    if (!isValidObjectId(actualChatId)) {
      console.log('DEBUG: chatId is not a valid ObjectId, trying to find room by name:', actualChatId);
      const room = await Room.findOne({ name: actualChatId });
      if (!room) {
        console.log('DEBUG: Sala não encontrada pelo nome:', actualChatId);
        return res.status(404).json({ message: 'Sala não encontrada.' });
      }
      actualChatId = room._id;
      console.log('DEBUG: Found room, actualChatId is now:', actualChatId);
    }

    console.log('DEBUG: Final actualChatId before Message.find():', actualChatId);
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const messages = await Message.find({ chatId: actualChatId })
      .populate('remetente', 'nome')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Message.countDocuments({ chatId: actualChatId })

    res.json({
      messages,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    next(error)
  }
})

// Buscar mensagens
router.get('/search/:chatId', messageLimiter, async (req, res, next) => {
  try {
    let actualChatId = req.params.chatId;
    console.log('DEBUG: Initial chatId in messages.js GET /search/:chatId:', actualChatId);
    console.log('DEBUG: isValidObjectId(actualChatId) (initial):', isValidObjectId(actualChatId));

    // Se o chatId não for um ObjectId válido, tente encontrá-lo pelo nome
    if (!isValidObjectId(actualChatId)) {
      console.log('DEBUG: chatId is not a valid ObjectId, trying to find room by name:', actualChatId);
      const room = await Room.findOne({ name: actualChatId });
      if (!room) {
        console.log('DEBUG: Sala não encontrada pelo nome:', actualChatId);
        return res.status(404).json({ message: 'Sala não encontrada.' });
      }
      actualChatId = room._id;
      console.log('DEBUG: Found room, actualChatId is now:', actualChatId);
    }
    console.log('DEBUG: Final actualChatId before Message.find() for search:', actualChatId);
    const { query } = req.query
    const messages = await Message.find({
      chatId: actualChatId,
      mensagem: { $regex: query, $options: 'i' }
    })
      .populate('remetente', 'nome')
      .sort({ timestamp: -1 })
      .limit(20)

    res.json(messages)
  } catch (error) {
    next(error)
  }
})

// Enviar nova mensagem
router.post('/', messageLimiter, validateMessage, async (req, res, next) => {
  let actualChatId = req.body.chatId;
  console.log('DEBUG: Initial chatId in messages.js POST /:', actualChatId);
  console.log('DEBUG: isValidObjectId(actualChatId) (initial POST):', isValidObjectId(actualChatId));

  // Se o chatId não for um ObjectId válido, tente encontrá-lo pelo nome
  if (!isValidObjectId(actualChatId)) {
    console.log('DEBUG: chatId is not a valid ObjectId (POST), trying to find room by name:', actualChatId);
    const room = await Room.findOne({ name: actualChatId });
    if (!room) {
      console.log('DEBUG: Sala não encontrada pelo nome (POST):', actualChatId);
      return res.status(404).json({ message: 'Sala não encontrada.' });
    }
    actualChatId = room._id;
    console.log('DEBUG: Found room (POST), actualChatId is now:', actualChatId);
  }
  console.log('DEBUG: Final actualChatId before new Message (POST):', actualChatId);
  const message = new Message({
    chatId: actualChatId,
    remetente: req.user._id, // Usando o ID do usuário autenticado
    mensagem: req.body.mensagem,
    tipo: req.body.tipo || 'texto',
    arquivoUrl: req.body.arquivoUrl
  })

  try {
    const newMessage = await message.save()
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('remetente', 'nome')
    res.status(201).json(populatedMessage)
  } catch (error) {
    next(error)
  }
})

// Editar mensagem
router.patch('/:id', messageLimiter, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
    
    if (!message) {
      return res.status(404).json({ message: 'Mensagem não encontrada' })
    }

    // Verificar se o usuário é o autor da mensagem
    if (message.remetente.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Não autorizado a editar esta mensagem' })
    }

    message.mensagem = req.body.mensagem
    message.editada = true
    const updatedMessage = await message.save()
    
    res.json(updatedMessage)
  } catch (error) {
    next(error)
  }
})

// Adicionar reação a uma mensagem
router.post('/:id/reactions', messageLimiter, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message) {
      return res.status(404).json({ message: 'Mensagem não encontrada' })
    }

    // Verificar se o usuário já reagiu com este emoji
    const existingReaction = message.reacoes.find(
      r => r.usuario.toString() === req.user._id.toString() && r.emoji === req.body.emoji
    )

    if (existingReaction) {
      return res.status(400).json({ message: 'Você já reagiu com este emoji' })
    }

    const reaction = {
      usuario: req.user._id,
      emoji: req.body.emoji
    }
    
    message.reacoes.push(reaction)
    const updatedMessage = await message.save()
    res.json(updatedMessage)
  } catch (error) {
    next(error)
  }
})

// Remover reação de uma mensagem
router.delete('/:id/reactions/:emoji', messageLimiter, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message) {
      return res.status(404).json({ message: 'Mensagem não encontrada' })
    }

    message.reacoes = message.reacoes.filter(
      reaction => !(reaction.usuario.toString() === req.user._id.toString() && 
                   reaction.emoji === req.params.emoji)
    )
    
    const updatedMessage = await message.save()
    res.json(updatedMessage)
  } catch (error) {
    next(error)
  }
})

// Deletar mensagem
router.delete('/:id', async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
    if (!message) {
      return res.status(404).json({ message: 'Mensagem não encontrada' })
    }

    // Verificar se o usuário é o autor da mensagem
    if (message.remetente.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Não autorizado a deletar esta mensagem' })
    }

    await message.deleteOne()
    res.json({ message: 'Mensagem deletada com sucesso' })
  } catch (error) {
    next(error)
  }
})

module.exports = router 