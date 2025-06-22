// App Constants
export const APP = {
  NAME: 'TeamUp India',
  VERSION: '1.0.0',
  BUILD: '1',
  BUNDLE_ID: 'com.teamupindia',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@TeamUpIndia:authToken',
  USER_DATA: '@TeamUpIndia:userData',
  SETTINGS: '@TeamUpIndia:settings',
  THEME: '@TeamUpIndia:theme',
  LANGUAGE: '@TeamUpIndia:language',
};

// Default Settings
export const DEFAULT_SETTINGS = {
  notifications: true,
  darkMode: false,
  language: 'en',
  currency: 'INR',
  distanceUnit: 'km',
};

// Supported Languages
export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    direction: 'ltr',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    direction: 'ltr',
  },
};

// Regex Patterns
export const REGEX = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[0-9]{10}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
  PIN_CODE: /^[0-9]{6}$/,
};

// API Constants
export const API = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGE_SIZE: 20,
};

// File Upload Constants
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  MAX_FILES: 5,
};

// Social Media Links
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/teamupindia',
  TWITTER: 'https://twitter.com/teamupindia',
  INSTAGRAM: 'https://instagram.com/teamupindia',
  YOUTUBE: 'https://youtube.com/teamupindia',
  LINKEDIN: 'https://linkedin.com/company/teamupindia',
};

// Support Contact
export const SUPPORT = {
  EMAIL: 'support@teamupindia.com',
  PHONE: '+91-1234567890',
  HOURS: '9:00 AM - 6:00 PM IST',
  WHATSAPP: '+91-1234567890',
}; 