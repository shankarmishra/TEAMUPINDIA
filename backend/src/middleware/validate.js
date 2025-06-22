const validator = require('validator');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Validate email
const validateEmail = (email) => {
  return validator.isEmail(email);
};

// Validate password
const validatePassword = (password) => {
  return password.length >= 8 && // minimum length
    /[A-Z]/.test(password) && // has uppercase
    /[a-z]/.test(password) && // has lowercase
    /[0-9]/.test(password) && // has number
    /[^A-Za-z0-9]/.test(password); // has special char
};

// Validate phone number
const validatePhone = (phone) => {
  return validator.isMobilePhone(phone);
};

// Validate URL
const validateURL = (url) => {
  return validator.isURL(url);
};

// Validate date
const validateDate = (date) => {
  return validator.isDate(date);
};

// Validate coordinates
const validateCoordinates = (coords) => {
  if (!coords || !coords.type || !coords.coordinates) return false;
  if (coords.type !== 'Point') return false;
  const [longitude, latitude] = coords.coordinates;
  return validator.isLatLong(`${latitude},${longitude}`);
};

// Request body validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      logger.error('Validation error:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: error.details[0].message
      });
    }
    next();
  };
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(err => err.msg).join(', ')
    });
  }
  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateURL,
  validateDate,
  validateCoordinates,
  validateRequest,
  validate
}; 