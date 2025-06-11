const User = require('../models/User');
const Message = require('../models/Message');
const Idea = require('../models/Idea');
const NotificationService = require('./NotificationService');

class ModerationService {
  // Verificar conteúdo inapropriado
  async verificarConteudo(texto) {
    // Aqui você pode integrar com serviços de moderação de conteúdo
    // como Google Cloud Content Moderation ou implementar suas próprias regras
    const palavrasProibidas = ['palavrao1', 'palavrao2']; // Exemplo
    return palavrasProibidas.some(palavra => texto.toLowerCase().includes(palavra));
  }

  // Reportar mensagem
  async reportarMensagem(mensagemId, usuarioId, motivo) {
    try {
      const mensagem = await Message.findById(mensagemId);
      if (!mensagem) throw new Error('Mensagem não encontrada');

      mensagem.reports = mensagem.reports || [];
      mensagem.reports.push({
        usuario: usuarioId,
        motivo,
        data: new Date()
      });

      await mensagem.save();

      // Notificar moderadores
      const moderadores = await User.find({ role: 'moderador' });
      for (const moderador of moderadores) {
        await NotificationService.notificarSistema(
          moderador._id,
          `Nova denúncia de mensagem: ${motivo}`
        );
      }

      return mensagem;
    } catch (error) {
      console.error('Erro ao reportar mensagem:', error);
      throw error;
    }
  }

  // Reportar ideia
  async reportarIdea(ideaId, usuarioId, motivo) {
    try {
      const idea = await Idea.findById(ideaId);
      if (!idea) throw new Error('Ideia não encontrada');

      idea.reports = idea.reports || [];
      idea.reports.push({
        usuario: usuarioId,
        motivo,
        data: new Date()
      });

      await idea.save();

      // Notificar moderadores
      const moderadores = await User.find({ role: 'moderador' });
      for (const moderador of moderadores) {
        await NotificationService.notificarSistema(
          moderador._id,
          `Nova denúncia de ideia: ${motivo}`
        );
      }

      return idea;
    } catch (error) {
      console.error('Erro ao reportar ideia:', error);
      throw error;
    }
  }

  // Banir usuário
  async banirUsuario(usuarioId, moderadorId, motivo, duracao) {
    try {
      const usuario = await User.findById(usuarioId);
      if (!usuario) throw new Error('Usuário não encontrado');

      usuario.banido = {
        ativo: true,
        motivo,
        moderador: moderadorId,
        dataInicio: new Date(),
        dataFim: duracao ? new Date(Date.now() + duracao) : null
      };

      await usuario.save();

      // Notificar usuário
      await NotificationService.notificarSistema(
        usuarioId,
        `Você foi banido. Motivo: ${motivo}`
      );

      return usuario;
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      throw error;
    }
  }

  // Remover banimento
  async removerBanimento(usuarioId, moderadorId) {
    try {
      const usuario = await User.findById(usuarioId);
      if (!usuario) throw new Error('Usuário não encontrado');

      usuario.banido = {
        ativo: false,
        dataRemocao: new Date(),
        moderadorRemocao: moderadorId
      };

      await usuario.save();

      // Notificar usuário
      await NotificationService.notificarSistema(
        usuarioId,
        'Seu banimento foi removido'
      );

      return usuario;
    } catch (error) {
      console.error('Erro ao remover banimento:', error);
      throw error;
    }
  }

  // Deletar mensagem
  async deletarMensagem(mensagemId, moderadorId) {
    try {
      const mensagem = await Message.findById(mensagemId);
      if (!mensagem) throw new Error('Mensagem não encontrada');

      // Notificar remetente
      await NotificationService.notificarSistema(
        mensagem.remetente,
        'Uma de suas mensagens foi removida por um moderador'
      );

      await mensagem.remove();
      return true;
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      throw error;
    }
  }

  // Deletar ideia
  async deletarIdea(ideaId, moderadorId) {
    try {
      const idea = await Idea.findById(ideaId);
      if (!idea) throw new Error('Ideia não encontrada');

      // Notificar autor
      await NotificationService.notificarSistema(
        idea.autor,
        'Uma de suas ideias foi removida por um moderador'
      );

      await idea.remove();
      return true;
    } catch (error) {
      console.error('Erro ao deletar ideia:', error);
      throw error;
    }
  }
}

module.exports = new ModerationService(); 