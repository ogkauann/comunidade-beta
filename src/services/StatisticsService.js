const User = require('../models/User');
const Message = require('../models/Message');
const Idea = require('../models/Idea');

class StatisticsService {
  // Estatísticas gerais
  async getEstatisticasGerais() {
    try {
      const totalUsuarios = await User.countDocuments();
      const totalMensagens = await Message.countDocuments();
      const totalIdeias = await Idea.countDocuments();
      const usuariosAtivos = await User.countDocuments({ status: 'online' });

      return {
        totalUsuarios,
        totalMensagens,
        totalIdeias,
        usuariosAtivos,
        mediaMensagensPorUsuario: totalMensagens / totalUsuarios,
        mediaIdeiasPorUsuario: totalIdeias / totalUsuarios
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas gerais:', error);
      throw error;
    }
  }

  // Estatísticas de usuário
  async getEstatisticasUsuario(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('Usuário não encontrado');

      const mensagensEnviadas = await Message.countDocuments({ remetente: userId });
      const ideiasCriadas = await Idea.countDocuments({ autor: userId });
      const reacoesRecebidas = await Message.aggregate([
        { $match: { remetente: userId } },
        { $unwind: '$reacoes' },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]);

      return {
        mensagensEnviadas,
        ideiasCriadas,
        reacoesRecebidas: reacoesRecebidas[0]?.total || 0,
        salasFavoritas: user.salasFavoritas.length,
        amigos: user.amigos.length
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do usuário:', error);
      throw error;
    }
  }

  // Estatísticas de sala
  async getEstatisticasSala(salaId) {
    try {
      const mensagens = await Message.countDocuments({ chatId: salaId });
      const participantes = await Message.distinct('remetente', { chatId: salaId });
      const reacoes = await Message.aggregate([
        { $match: { chatId: salaId } },
        { $unwind: '$reacoes' },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]);

      return {
        totalMensagens: mensagens,
        totalParticipantes: participantes.length,
        totalReacoes: reacoes[0]?.total || 0,
        mediaMensagensPorParticipante: mensagens / participantes.length
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas da sala:', error);
      throw error;
    }
  }

  // Atividade por período
  async getAtividadePorPeriodo(periodo = 'dia') {
    try {
      const dataInicio = new Date();
      switch (periodo) {
        case 'hora':
          dataInicio.setHours(dataInicio.getHours() - 1);
          break;
        case 'dia':
          dataInicio.setDate(dataInicio.getDate() - 1);
          break;
        case 'semana':
          dataInicio.setDate(dataInicio.getDate() - 7);
          break;
        case 'mes':
          dataInicio.setMonth(dataInicio.getMonth() - 1);
          break;
        default:
          dataInicio.setDate(dataInicio.getDate() - 1);
      }

      const mensagens = await Message.countDocuments({
        timestamp: { $gte: dataInicio }
      });

      const ideias = await Idea.countDocuments({
        createdAt: { $gte: dataInicio }
      });

      const usuariosAtivos = await User.countDocuments({
        ultimaAtividade: { $gte: dataInicio }
      });

      return {
        periodo,
        mensagens,
        ideias,
        usuariosAtivos
      };
    } catch (error) {
      console.error('Erro ao obter atividade por período:', error);
      throw error;
    }
  }

  // Top usuários
  async getTopUsuarios(limite = 10) {
    try {
      const topMensagens = await Message.aggregate([
        { $group: { _id: '$remetente', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: limite }
      ]);

      const topIdeias = await Idea.aggregate([
        { $group: { _id: '$autor', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: limite }
      ]);

      const topReacoes = await Message.aggregate([
        { $unwind: '$reacoes' },
        { $group: { _id: '$remetente', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: limite }
      ]);

      return {
        topMensagens,
        topIdeias,
        topReacoes
      };
    } catch (error) {
      console.error('Erro ao obter top usuários:', error);
      throw error;
    }
  }

  // Atualizar estatísticas
  async atualizarEstatisticas(userId, tipo) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('Usuário não encontrado');

      switch (tipo) {
        case 'mensagem':
          user.estatisticas.mensagensEnviadas += 1;
          break;
        case 'ideia':
          user.estatisticas.ideiasCriadas += 1;
          break;
        case 'reacao':
          user.estatisticas.reacoesRecebidas += 1;
          break;
      }

      await user.save();
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      throw error;
    }
  }
}

module.exports = new StatisticsService(); 