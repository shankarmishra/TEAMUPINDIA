const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true,
    maxlength: [100, 'Tournament name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Tournament description is required'],
    trim: true,
    maxlength: [1000, 'Tournament description cannot be more than 1000 characters']
  },
  sport: {
    type: String,
    required: [true, 'Sport is required'],
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton'],
    lowercase: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Tournament organizer is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Tournament start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'Tournament end date is required']
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required']
  },
  maxTeams: {
    type: Number,
    required: [true, 'Maximum number of teams is required'],
    min: [2, 'Tournament must have at least 2 teams'],
    max: [64, 'Tournament cannot have more than 64 teams']
  },
  minTeamsPerMatch: {
    type: Number,
    required: [true, 'Minimum teams per match is required'],
    min: [2, 'Match must have at least 2 teams']
  },
  maxTeamsPerMatch: {
    type: Number,
    required: [true, 'Maximum teams per match is required'],
    min: [2, 'Match must have at least 2 teams']
  },
  teams: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  matches: [{
    teams: [{
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
      },
      score: {
        type: Number,
        default: 0
      }
    }],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: Date,
    venue: {
      name: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number],
          default: [0, 0]
        }
      }
    }
  }],
  format: {
    type: String,
    enum: ['knockout', 'league', 'group-stage'],
    required: [true, 'Tournament format is required']
  },
  rules: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  prizes: [{
    position: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'registration-closed', 'in-progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes
tournamentSchema.index({ name: 'text', description: 'text' });
tournamentSchema.index({ sport: 1 });
tournamentSchema.index({ organizer: 1 });
tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ 'teams.team': 1 });
tournamentSchema.index({ 'matches.teams.team': 1 });

// Virtual for registered teams count
tournamentSchema.virtual('registeredTeamsCount').get(function() {
  return this.teams.length;
});

// Virtual for approved teams count
tournamentSchema.virtual('approvedTeamsCount').get(function() {
  return this.teams.filter(team => team.status === 'approved').length;
});

// Virtual for completed matches count
tournamentSchema.virtual('completedMatchesCount').get(function() {
  return this.matches.filter(match => match.status === 'completed').length;
});

// Pre-save middleware to validate dates
tournamentSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  if (this.registrationDeadline >= this.startDate) {
    next(new Error('Registration deadline must be before start date'));
  }
  next();
});

module.exports = mongoose.model('Tournament', tournamentSchema); 