const multer = require('multer');

const storage = multer.memoryStorage();

/** Profile photos only (no PDF). */
const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) {
      return cb(null, true);
    }
    return cb(new Error('Only image files are allowed'));
  },
});

module.exports = { uploadImage };
