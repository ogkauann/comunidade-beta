const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Pegar o token do header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Autenticação necessária' });
    }

    // Verificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar o usuário
    const user = await User.findOne({ 
      _id: decoded.userId,
      'tokens.token': token 
    });

    if (!user) {
      throw new Error();
    }

    // Adicionar o usuário e token ao request
    req.token = token;
    req.user = user;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Por favor, faça login novamente' });
  }
};

module.exports = auth; 