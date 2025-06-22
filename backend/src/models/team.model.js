const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [50, 'Team name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Team description is required'],
    trim: true,
    maxlength: [500, 'Team description cannot be more than 500 characters']
  },
  sport: {
    type: String,
    required: [true, 'Sport is required'],
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton'],
    lowercase: true
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Team captain is required']
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['captain', 'vice-captain', 'player'],
      default: 'player'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxPlayers: {
    type: Number,
    required: [true, 'Maximum number of players is required'],
    min: [2, 'Team must have at least 2 players'],
    max: [30, 'Team cannot have more than 30 players']
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
  },
  stats: {
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    draws: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes
teamSchema.index({ name: 'text', description: 'text' });
teamSchema.index({ location: '2dsphere' });
teamSchema.index({ sport: 1 });
teamSchema.index({ captain: 1 });
teamSchema.index({ 'players.user': 1 });

// Virtual for total matches
teamSchema.virtual('totalMatches').get(function() {
  return this.stats.wins + this.stats.losses + this.stats.draws;
});

// Virtual for win rate
teamSchema.virtual('winRate').get(function() {
  const totalMatches = this.totalMatches;
  return totalMatches > 0 ? (this.stats.wins / totalMatches * 100).toFixed(2) : 0;
});

// Pre-save middleware to ensure captain is in players array
teamSchema.pre('save', function(next) {
  const captainPlayer = this.players.find(p => p.user.toString() === this.captain.toString());
  if (!captainPlayer) {
    this.players.unshift({ user: this.captain, role: 'captain' });
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema); 