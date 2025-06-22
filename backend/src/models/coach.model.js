const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialties: [{
    type: String,
    required: true
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  certifications: [{
    name: {
      type: String,
      required: true
    },
    issuingOrganization: {
      type: String,
      required: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    expiryDate: Date,
    verificationUrl: String
  }],
  availability: {
    type: Map,
    of: [{
      startTime: String,
      endTime: String
    }]
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for search optimization
coachSchema.index({ specialties: 1, hourlyRate: 1 });

module.exports = mongoose.model('Coach', coachSchema); 