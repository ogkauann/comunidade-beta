const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

// Registrar novo usuário
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Criar novo usuário
    const user = new User({
      nome,
      email,
      senha
    });

    await user.save();
    const token = await user.gerarAuthToken();

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('Tentativa de login para o email:', email);

    // Buscar usuário
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado para o email:', email);
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    console.log('Usuário encontrado:', user.email);

    // Verificar senha
    const senhaValida = await user.verificarSenha(senha);
    if (!senhaValida) {
      console.log('Senha inválida para o usuário:', user.email);
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    console.log('Senha válida para o usuário:', user.email);

    // Gerar token
    const token = await user.gerarAuthToken();
    console.log('Token gerado para o usuário:', user.email);

    res.json({ user, token });
  } catch (error) {
    console.error('Erro no processo de login:', error);
    res.status(400).json({ message: error.message || 'Erro interno do servidor.' });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout de todos os dispositivos
router.post('/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.json({ message: 'Logout de todos os dispositivos realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obter perfil do usuário
router.get('/me', auth, async (req, res) => {
  try {
    // Busca o usuário novamente para garantir dados atualizados
    const user = await User.findById(req.user._id).select('-senha -tokens');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar perfil do usuário' });
  }
});

module.exports = router; 