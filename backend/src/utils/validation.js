const validator = require('validator');

const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validatePassword = (password) => {
  // Password must be at least 8 characters long and contain at least one number and one letter
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
};

const validatePhone = (phone) => {
  // Phone number must be 10 digits
  return /^[0-9]{10}$/.test(phone);
};

const validateURL = (url) => {
  return validator.isURL(url);
};

const validateDate = (date) => {
  return validator.isDate(date);
};

const validateCoordinates = (lat, lng) => {
  return validator.isLatLong(`${lat},${lng}`);
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateURL,
  validateDate,
  validateCoordinates
}; 