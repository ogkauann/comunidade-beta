const rateLimit = require('express-rate-limit');

// Limiter para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

// Limiter para API
const apiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW ? 
    parseInt(process.env.RATE_LIMIT_WINDOW) : 
    15 * 60 * 1000, // 15 minutos
  max: process.env.RATE_LIMIT_MAX ? 
    parseInt(process.env.RATE_LIMIT_MAX) : 
    100, // 100 requisições
  message: 'Muitas requisições. Tente novamente mais tarde.'
});

// Limiter para uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 uploads
  message: 'Limite de uploads excedido. Tente novamente em 1 hora.'
});

// Limiter para mensagens
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 mensagens
  message: 'Limite de mensagens excedido. Tente novamente em 1 minuto.'
});

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  messageLimiter
}; 