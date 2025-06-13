const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const auth = require('../middleware/auth');

// Rota para listar todos os usuários (exceto o próprio usuário logado)
router.get('/users', auth, async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.user.id);
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro do servidor');
  }
});

module.exports = router; 