const multer = require("multer");
const path = require("path");

const rootDir = path.dirname(require.main.filename);
const publicDir = path.dirname(rootDir);

const imageUploadFunc = (dir) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(publicDir, `/${dir}`));
    },
    filename: function (req, file, cb) {
      req.savedImages =
        "image_" +
        req.user.id +
        "-" +
        Date.now() +
        "." +
        file.mimetype.split("/")[1];
      cb(null, req.savedImages);
    },
  });
  return multer({ storage });
};

module.exports = imageUploadFunc;
