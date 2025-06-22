const Coach = require('../models/coach.model');
const User = require('../models/user.model');

/**
 * Get all coaches
 * @route GET /api/coaches
 * @access Public
 */
exports.getAllCoaches = async (req, res) => {
  try {
    const { specialty, minExperience, maxPrice } = req.query;
    let query = {};

    if (specialty) {
      query.specialties = specialty;
    }
    if (minExperience) {
      query.experience = { $gte: parseInt(minExperience) };
    }
    if (maxPrice) {
      query.hourlyRate = { $lte: parseInt(maxPrice) };
    }

    const coaches = await Coach.find(query)
      .populate('user', 'name email')
      .select('-reviews');
    res.json(coaches);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get coach by ID
 * @route GET /api/coaches/:id
 * @access Public
 */
exports.getCoachById = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id)
      .populate('user', 'name email')
      .populate('reviews.user', 'name');
    
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    res.json(coach);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create coach profile
 * @route POST /api/coaches
 * @access Private
 */
exports.createCoachProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'coach') {
      return res.status(403).json({ message: 'User is not authorized to be a coach' });
    }

    const existingCoach = await Coach.findOne({ user: req.user.id });
    if (existingCoach) {
      return res.status(400).json({ message: 'Coach profile already exists' });
    }

    const coach = new Coach({
      user: req.user.id,
      ...req.body
    });

    await coach.save();
    res.status(201).json(coach);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update coach profile
 * @route PUT /api/coaches/:id
 * @access Private
 */
exports.updateCoachProfile = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id);
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    if (coach.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedCoach = await Coach.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('user', 'name email');

    res.json(updatedCoach);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Add review to coach
 * @route POST /api/coaches/:id/reviews
 * @access Private
 */
exports.addCoachReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const coach = await Coach.findById(req.params.id);
    
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    const review = {
      user: req.user.id,
      rating,
      comment
    };

    coach.reviews.push(review);
    
    // Update average rating
    const totalRating = coach.reviews.reduce((sum, item) => sum + item.rating, 0);
    coach.rating = totalRating / coach.reviews.length;

    await coach.save();
    res.status(201).json(coach);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get coach's schedule
 * @route GET /api/coaches/:id/schedule
 * @access Public
 */
exports.getCoachSchedule = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id).select('availability');
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    res.json(coach.availability);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update coach's schedule
 * @route PUT /api/coaches/:id/schedule
 * @access Private
 */
exports.updateCoachSchedule = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id);
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    if (coach.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    coach.availability = req.body;
    await coach.save();
    res.json(coach.availability);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Search nearby coaches
 * @route POST /api/coaches/nearby
 * @access Public
 */
exports.searchNearbyCoaches = async (req, res) => {
  try {
    const { coordinates, radius, specialization, maxHourlyRate } = req.body;
    
    let query = {};
    
    if (specialization) {
      query.specialties = specialization;
    }
    
    if (maxHourlyRate) {
      query.hourlyRate = { $lte: maxHourlyRate };
    }
    
    const coaches = await Coach.find(query)
      .populate('user', 'name email')
      .select('-reviews');
    
    res.json({
      success: true,
      coaches
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 