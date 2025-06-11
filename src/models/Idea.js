const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  descricao: {
    type: String,
    required: true
  },
  salaChatId: {
    type: String,
    required: true,
    unique: true
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['ativa', 'em_desenvolvimento', 'concluida'],
    default: 'ativa'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Idea', ideaSchema); 