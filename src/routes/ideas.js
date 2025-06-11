const express = require('express')
const router = express.Router()
const Idea = require('../models/Idea')

// Listar todas as ideias
router.get('/', async (req, res) => {
  try {
    const ideas = await Idea.find().populate('autor', 'nome')
    res.json(ideas)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Criar nova ideia
router.post('/', async (req, res) => {
  const idea = new Idea({
    autor: req.body.autor,
    titulo: req.body.titulo,
    descricao: req.body.descricao,
    salaChatId: `chat_${Date.now()}`,
    tags: req.body.tags || []
  })

  try {
    const newIdea = await idea.save()
    res.status(201).json(newIdea)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Buscar ideia por ID
router.get('/:id', async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id).populate('autor', 'nome')
    if (idea) {
      res.json(idea)
    } else {
      res.status(404).json({ message: 'Ideia não encontrada' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Atualizar ideia
router.patch('/:id', async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
    if (idea) {
      Object.assign(idea, req.body)
      const updatedIdea = await idea.save()
      res.json(updatedIdea)
    } else {
      res.status(404).json({ message: 'Ideia não encontrada' })
    }
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Deletar ideia
router.delete('/:id', async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
    if (idea) {
      await idea.remove()
      res.json({ message: 'Ideia deletada' })
    } else {
      res.status(404).json({ message: 'Ideia não encontrada' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router 