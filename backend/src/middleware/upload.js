const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i.test(file.originalname);
    if (!allowed) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
