const express = require('express')
const router = express.Router()
const Idea = require('../models/Idea')
const auth = require('../middleware/auth') // Importar o middleware de autenticação
const { apiLimiter } = require('../middleware/rateLimit'); // Importar apiLimiter

// Aplicar middleware de autenticação a todas as rotas de ideias
router.use(auth)

// Aplicar apiLimiter a todas as rotas de ideias
router.use(apiLimiter)

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
    autor: req.user._id, // Usar o ID do usuário autenticado
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
      // Verificar se o usuário é o autor da ideia para permitir a atualização
      if (idea.autor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Não autorizado a editar esta ideia' })
      }
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
      // Verificar se o usuário é o autor da ideia para permitir a exclusão
      if (idea.autor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Não autorizado a deletar esta ideia' })
      }
      await idea.deleteOne()
      res.json({ message: 'Ideia deletada' })
    } else {
      res.status(404).json({ message: 'Ideia não encontrada' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router 