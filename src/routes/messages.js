const express = require('express')
const router = express.Router()
const Message = require('../models/Message')

// Listar mensagens de uma sala
router.get('/:chatId', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('remetente', 'nome')
      .sort({ timestamp: 1 })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Enviar nova mensagem
router.post('/', async (req, res) => {
  const message = new Message({
    chatId: req.body.chatId,
    remetente: req.body.remetente,
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
    res.status(400).json({ message: error.message })
  }
})

// Adicionar reação a uma mensagem
router.post('/:id/reactions', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
    if (message) {
      const reaction = {
        usuario: req.body.usuario,
        emoji: req.body.emoji
      }
      message.reacoes.push(reaction)
      const updatedMessage = await message.save()
      res.json(updatedMessage)
    } else {
      res.status(404).json({ message: 'Mensagem não encontrada' })
    }
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Remover reação de uma mensagem
router.delete('/:id/reactions/:userId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
    if (message) {
      message.reacoes = message.reacoes.filter(
        reaction => reaction.usuario.toString() !== req.params.userId
      )
      const updatedMessage = await message.save()
      res.json(updatedMessage)
    } else {
      res.status(404).json({ message: 'Mensagem não encontrada' })
    }
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Deletar mensagem
router.delete('/:id', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
    if (message) {
      await message.remove()
      res.json({ message: 'Mensagem deletada' })
    } else {
      res.status(404).json({ message: 'Mensagem não encontrada' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router 