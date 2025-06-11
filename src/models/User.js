const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  senha: {
    type: String,
    required: true
  },
  bio: String,
  avatar: String,
  status: {
    type: String,
    enum: ['online', 'offline', 'ausente'],
    default: 'offline'
  },
  ultimaAtividade: {
    type: Date,
    default: Date.now
  },
  notificacoes: [{
    tipo: {
      type: String,
      enum: ['mensagem', 'reacao', 'mencao', 'sistema']
    },
    mensagem: String,
    lida: {
      type: Boolean,
      default: false
    },
    data: {
      type: Date,
      default: Date.now
    }
  }],
  configuracoes: {
    tema: {
      type: String,
      enum: ['claro', 'escuro', 'sistema'],
      default: 'sistema'
    },
    notificacoes: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    privacidade: {
      mostrarStatus: {
        type: Boolean,
        default: true
      },
      mostrarUltimaAtividade: {
        type: Boolean,
        default: true
      }
    }
  },
  estatisticas: {
    mensagensEnviadas: {
      type: Number,
      default: 0
    },
    ideiasCriadas: {
      type: Number,
      default: 0
    },
    reacoesRecebidas: {
      type: Number,
      default: 0
    }
  },
  salasFavoritas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Idea'
  }],
  amigos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bloqueados: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Método para atualizar última atividade
userSchema.methods.atualizarAtividade = async function() {
  this.ultimaAtividade = new Date();
  await this.save();
};

// Método para adicionar notificação
userSchema.methods.adicionarNotificacao = async function(tipo, mensagem) {
  this.notificacoes.push({ tipo, mensagem });
  await this.save();
};

// Método para marcar notificações como lidas
userSchema.methods.marcarNotificacoesComoLidas = async function() {
  this.notificacoes.forEach(notificacao => {
    notificacao.lida = true;
  });
  await this.save();
};

module.exports = mongoose.model('User', userSchema); 