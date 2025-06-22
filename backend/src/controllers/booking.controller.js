const Booking = require('../models/booking.model');
const Coach = require('../models/coach.model');
const logger = require('../utils/logger');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User)
exports.createBooking = async (req, res) => {
  try {
    const { coachId, sport, date, slot } = req.body;

    // Validate date format
    const bookingDate = new Date(date);
    if (isNaN(bookingDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Check if date is in the past
    if (bookingDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates'
      });
    }

    // Validate slot format
    const [startTime, endTime] = slot.split('-');
    if (!startTime || !endTime || !startTime.match(/^\d{2}:\d{2}$/) || !endTime.match(/^\d{2}:\d{2}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot format. Expected format: HH:MM-HH:MM'
      });
    }

    // Check if coach exists
    const coach = await Coach.findById(coachId);
    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Check if coach teaches the requested sport
    if (!coach.specializations.includes(sport)) {
      return res.status(400).json({
        success: false,
        message: 'Coach does not teach this sport'
      });
    }

    // Get day of week (0-6, starting from Sunday)
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[bookingDate.getDay()];
    
    // Check coach's availability for the day
    const dayAvailability = coach.availability.get(dayOfWeek);
    if (!dayAvailability || !Array.isArray(dayAvailability)) {
      return res.status(400).json({
        success: false,
        message: 'Coach is not available on this day'
      });
    }

    // Find matching slot in coach's availability
    const slotAvailable = dayAvailability.find(
      s => s.startTime === startTime && s.endTime === endTime
    );

    if (!slotAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This slot is not available in coach\'s schedule'
      });
    }

    // Check if slot is already booked
    const existingBooking = await Booking.findOne({
      coach: coachId,
      date: {
        $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        $lt: new Date(bookingDate.setHours(23, 59, 59, 999))
      },
      slot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked'
      });
    }

    // Create booking
    const booking = await Booking.create({
      user: req.user._id,
      coach: coachId,
      sport,
      date: bookingDate,
      slot,
      status: 'pending'
    });

    // Populate coach details in response
    await booking.populate('coach', 'name email phone');

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking'
    });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/user
// @access  Private (User)
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('coach', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    logger.error('Error getting user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting bookings'
    });
  }
};

// @desc    Get coach's bookings
// @route   GET /api/bookings/coach
// @access  Private (Coach)
exports.getCoachBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ coach: req.coach._id })
      .populate('user', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    logger.error('Error getting coach bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting bookings'
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private (User/Coach)
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('coach', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to view this booking
    const isUser = booking.user._id.toString() === req.user._id.toString();
    const isCoach = req.coach && booking.coach._id.toString() === req.coach._id.toString();

    if (!isUser && !isCoach) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Error getting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting booking'
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Coach)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.coach.toString() !== req.coach._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status'
    });
  }
};

// @desc    Rate and review booking
// @route   POST /api/bookings/:id/rate
// @access  Private (User)
exports.rateBooking = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this booking'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed bookings'
      });
    }

    booking.rating = rating;
    booking.review = review;
    await booking.save();

    // Update coach rating
    const coach = await Coach.findById(booking.coach);
    const coachBookings = await Booking.find({
      coach: booking.coach,
      rating: { $exists: true }
    });

    const totalRating = coachBookings.reduce((sum, b) => sum + b.rating, 0);
    coach.rating = totalRating / coachBookings.length;
    coach.totalReviews = coachBookings.length;
    await coach.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Error rating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating booking'
    });
  }
}; 