const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
const validateMessage = require('../middleware/validateMessage')
const auth = require('../middleware/auth')

// Middleware de autenticação para todas as rotas
router.use(auth)

// Listar mensagens de uma sala com paginação
router.get('/:chatId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('remetente', 'nome')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Message.countDocuments({ chatId: req.params.chatId })

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
router.get('/search/:chatId', async (req, res) => {
  try {
    const { query } = req.query
    const messages = await Message.find({
      chatId: req.params.chatId,
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
router.post('/', validateMessage, async (req, res) => {
  const message = new Message({
    chatId: req.body.chatId,
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
router.patch('/:id', async (req, res) => {
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
router.post('/:id/reactions', async (req, res) => {
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
router.delete('/:id/reactions/:emoji', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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