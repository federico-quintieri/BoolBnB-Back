const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public'); // Percorso in cui salvare le immagini
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Nome file univoco
  },
});

const upload = multer({ storage: storage }).array('images', 10); // Accetta fino a 10 immagini

module.exports = upload;