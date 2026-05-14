const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

/** Profile photos only (images only). */
const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const hasImageMime = /^image\/.+$/i.test(file.mimetype || '');
    const hasImageExt = /\.(jpe?g|png|gif|webp)$/i.test(file.originalname);
    if (hasImageMime || hasImageExt) {
      return cb(null, true);
    }
    return cb(new ApiError(400, 'Only image files are allowed'));
  },
});

module.exports = { uploadImage };
