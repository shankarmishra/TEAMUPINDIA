const express = require('express');
const router = express.Router();
const { protect, coachOnly } = require('../middleware/auth');
const {
  getAllCoaches,
  getCoachById,
  createCoachProfile,
  updateCoachProfile,
  addCoachReview,
  getCoachSchedule,
  updateCoachSchedule,
  searchNearbyCoaches
} = require('../controllers/coach.controller');

// Public routes
router.get('/', getAllCoaches);
router.get('/:id', getCoachById);
router.post('/nearby', searchNearbyCoaches);

// Protected routes
router.post('/', protect, createCoachProfile);
router.put('/:id', protect, coachOnly, updateCoachProfile);
router.post('/:id/reviews', protect, addCoachReview);
router.get('/:id/schedule', getCoachSchedule);
router.put('/:id/schedule', protect, coachOnly, updateCoachSchedule);

module.exports = router; 