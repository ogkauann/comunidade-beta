const User = require('../models/User');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Enviar notificação para um usuário
  async enviarNotificacao(userId, tipo, mensagem) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Adicionar notificação ao usuário
      await user.adicionarNotificacao(tipo, mensagem);

      // Enviar email se configurado
      if (user.configuracoes.notificacoes.email) {
        await this.enviarEmail(user.email, mensagem);
      }

      // Enviar push notification se configurado
      if (user.configuracoes.notificacoes.push) {
        await this.enviarPushNotification(userId, mensagem);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  // Enviar email
  async enviarEmail(email, mensagem) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Nova notificação - Comunidade Chat',
        html: `
          <h1>Nova notificação</h1>
          <p>${mensagem}</p>
          <p>Acesse o chat para mais detalhes.</p>
        `
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }

  // Enviar push notification
  async enviarPushNotification(userId, mensagem) {
    try {
      // Aqui você pode integrar com serviços como Firebase Cloud Messaging
      // ou Web Push Notifications
      console.log(`Push notification para ${userId}: ${mensagem}`);
    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
    }
  }

  // Notificar menção em mensagem
  async notificarMencao(mensagem, usuarioMencionado) {
    const notificacao = `${mensagem.remetente.nome} mencionou você em uma mensagem`;
    await this.enviarNotificacao(usuarioMencionado, 'mencao', notificacao);
  }

  // Notificar reação em mensagem
  async notificarReacao(mensagem, usuarioReagiu, emoji) {
    const notificacao = `${usuarioReagiu.nome} reagiu com ${emoji} à sua mensagem`;
    await this.enviarNotificacao(mensagem.remetente, 'reacao', notificacao);
  }

  // Notificar nova mensagem em sala
  async notificarNovaMensagem(sala, mensagem) {
    const usuarios = await User.find({
      'salasFavoritas': sala._id,
      '_id': { $ne: mensagem.remetente }
    });

    const notificacao = `Nova mensagem em ${sala.titulo}: ${mensagem.mensagem}`;
    
    for (const usuario of usuarios) {
      await this.enviarNotificacao(usuario._id, 'mensagem', notificacao);
    }
  }

  // Notificar sistema
  async notificarSistema(userId, mensagem) {
    await this.enviarNotificacao(userId, 'sistema', mensagem);
  }
}

module.exports = new NotificationService(); 