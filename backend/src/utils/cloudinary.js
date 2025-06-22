const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param {string} file - File path or base64 string
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload response
 */
const uploadToCloudinary = async (file, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'sports-app',
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    const result = await cloudinary.uploader.upload(file, {
      ...defaultOptions,
      ...options
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the file
 * @returns {Promise<Object>} Cloudinary deletion response
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('Cloudinary deletion error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
};

/**
 * Generate a Cloudinary URL with transformations
 * @param {string} publicId - Cloudinary public ID of the file
 * @param {Object} options - Transformation options
 * @returns {string} Transformed Cloudinary URL
 */
const getCloudinaryUrl = (publicId, options = {}) => {
  const defaultOptions = {
    secure: true,
    quality: 'auto:good',
    fetch_format: 'auto'
  };

  return cloudinary.url(publicId, {
    ...defaultOptions,
    ...options
  });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl
}; 