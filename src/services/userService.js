const User = require('../models/User');

const userService = {
  getAllUsers: async (currentUserId) => {
    try {
      // Excluir o usuário atual da lista, e talvez senhas ou outros dados sensíveis
      const users = await User.find({ _id: { $ne: currentUserId } }).select('_id nome email');
      return users;
    } catch (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }
  },
};

module.exports = userService; 