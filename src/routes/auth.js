const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Registrar usuário
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verificar se usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);

    // Criar usuário
    const user = new User({
      nome,
      email,
      senha: hashedPassword
    });

    await user.save();

    // Gerar token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Verificar se usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obter perfil do usuário
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-senha');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Atualizar perfil
router.patch('/profile', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['nome', 'email', 'bio', 'avatar'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Atualizações inválidas' });
  }

  try {
    const user = await User.findById(req.user.id);
    updates.forEach(update => user[update] = req.body[update]);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 