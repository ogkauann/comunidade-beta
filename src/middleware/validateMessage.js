const Joi = require('joi');

const messageSchema = Joi.object({
  chatId: Joi.string().required(),
  remetente: Joi.string().required(),
  mensagem: Joi.string().required().min(1).max(1000),
  tipo: Joi.string().valid('texto', 'arquivo', 'imagem', 'codigo').default('texto'),
  arquivoUrl: Joi.string().uri().when('tipo', {
    is: Joi.string().valid('arquivo', 'imagem'),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const validateMessage = (req, res, next) => {
  const { error } = messageSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Dados inválidos', 
      details: error.details.map(detail => detail.message) 
    });
  }
  next();
};

module.exports = validateMessage; 