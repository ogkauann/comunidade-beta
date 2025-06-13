const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Erro de validação',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'ID inválido',
      details: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Dados duplicados',
      details: 'Já existe um registro com estes dados'
    });
  }

  res.status(500).json({
    message: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler; 