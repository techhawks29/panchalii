const cloudinary = require('cloudinary').v2;
const config = require('../config/config');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const uploadImage = async (filePath, folder = 'panchalii/products') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    transformation: [
      { width: 1200, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
    ],
  });
  return { url: result.secure_url, publicId: result.public_id };
};

const uploadBuffer = async (buffer, folder = 'panchalii/products') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

const deleteImage = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

// Thumbnail URL for a Cloudinary URL
const thumb = (url, width = 400) =>
  url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`);

module.exports = { uploadImage, uploadBuffer, deleteImage, thumb };
