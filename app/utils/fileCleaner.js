const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");

const imageCleaner = async (file) => {
  if (!file?.filename) return;

  try {
    await cloudinary.uploader.destroy(file.filename);
  } catch (error) {
    console.log(`Image Cleaner Error: ${error.message}`);
  }
};

const csvCleaner = async (file) => {
  if (!file?.path) return;

  try {
    await fs.unlink(file.path);
  } catch (error) {
    console.log(`CSV Cleaner Error: ${error.message}`);
  }
};

module.exports = {
  imageCleaner,
  csvCleaner,
};
