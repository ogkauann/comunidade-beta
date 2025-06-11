const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true
  },
  remetente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema); 