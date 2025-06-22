const express = require('express');
const router = express.Router();
const { protect, coachOnly } = require('../middleware/auth');
const {
  createBooking,
  getUserBookings,
  getCoachBookings,
  getBooking,
  updateBookingStatus,
  rateBooking
} = require('../controllers/booking.controller');

// User routes
router.post('/', protect, createBooking);
router.get('/user', protect, getUserBookings);
router.get('/:id', protect, getBooking);
router.post('/:id/rate', protect, rateBooking);

// Coach routes
router.get('/coach', protect, coachOnly, getCoachBookings);
router.put('/:id/status', protect, coachOnly, updateBookingStatus);

module.exports = router; 