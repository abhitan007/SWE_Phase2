const multer = require('multer');

// Memory storage — files are stored in MongoDB as base64, not on disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

module.exports = upload;
