const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload destination directories exist
const createDirIfNotExist = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storageConfig = (subfolder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, `../../uploads/${subfolder}`);
    createDirIfNotExist(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${subfolder}-${uniqueSuffix}${cleanExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (.jpg, .jpeg, .png, .webp) are allowed!'));
  }
};

const uploadActivity = multer({
  storage: storageConfig('activities'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

const uploadCommittee = multer({
  storage: storageConfig('committee'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const uploadGallery = multer({
  storage: storageConfig('gallery'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

module.exports = {
  uploadActivity,
  uploadCommittee,
  uploadGallery
};
