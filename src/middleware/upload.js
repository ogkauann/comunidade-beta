const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;

// Configurar storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrar arquivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'), false);
  }
};

// Configurar upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
  }
});

// Middleware para processar imagens
const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    if (req.file.mimetype.startsWith('image/')) {
      const filePath = req.file.path;
      const fileName = path.basename(filePath, path.extname(filePath));
      const outputPath = path.join(path.dirname(filePath), `${fileName}-processed${path.extname(filePath)}`);

      await sharp(filePath)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      // Remover arquivo original
      await fs.unlink(filePath);
      
      // Atualizar req.file com o novo caminho
      req.file.path = outputPath;
      req.file.filename = path.basename(outputPath);
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  processImage
}; 