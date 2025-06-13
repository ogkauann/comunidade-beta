const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  remetente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mensagem: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['texto', 'arquivo', 'imagem', 'codigo'],
    default: 'texto'
  },
  arquivoUrl: String,
  reacoes: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String
  }],
  respostaPara: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  editada: {
    type: Boolean,
    default: false
  },
  fixada: {
    type: Boolean,
    default: false
  },
  mencionados: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  metadata: {
    tipo: String,
    valor: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Índices compostos para melhorar performance
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ remetente: 1, timestamp: -1 });

// Método para adicionar reação
messageSchema.methods.adicionarReacao = async function(usuarioId, emoji) {
  const reacaoExistente = this.reacoes.find(
    r => r.usuario.toString() === usuarioId.toString() && r.emoji === emoji
  );
  
  if (reacaoExistente) {
    throw new Error('Usuário já reagiu com este emoji');
  }

  this.reacoes.push({ usuario: usuarioId, emoji });
  return this.save();
};

// Método para remover reação
messageSchema.methods.removerReacao = async function(usuarioId, emoji) {
  this.reacoes = this.reacoes.filter(
    r => !(r.usuario.toString() === usuarioId.toString() && r.emoji === emoji)
  );
  return this.save();
};

// Método para marcar como editada
messageSchema.methods.marcarComoEditada = async function() {
  this.editada = true;
  return this.save();
};

// Método para fixar/desfixar mensagem
messageSchema.methods.toggleFixada = async function() {
  this.fixada = !this.fixada;
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema); 