const Team = require('../models/team.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Create a new team
 * @route POST /api/teams
 * @access Private
 */
exports.createTeam = async (req, res) => {
  try {
    const { name, sport, description, maxPlayers, location } = req.body;

    // Create team with captain as first player
    const team = await Team.create({
      name,
      sport,
      description,
      maxPlayers,
      location,
      captain: req.user._id,
      players: [{
        user: req.user._id,
        role: 'captain'
      }]
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating team'
    });
  }
};

/**
 * Get all teams
 * @route GET /api/teams
 * @access Public
 */
exports.getTeams = async (req, res) => {
  try {
    const { sport } = req.query;
    const query = sport ? { sport } : {};
    
    const teams = await Team.find(query)
      .populate('captain', 'name email')
      .populate('players.user', 'name email');

    res.status(200).json({
      success: true,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teams'
    });
  }
};

/**
 * Get single team
 * @route GET /api/teams/:id
 * @access Public
 */
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('captain', 'name email')
      .populate('players.user', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team'
    });
  }
};

/**
 * Update team
 * @route PUT /api/teams/:id
 * @access Private
 */
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team captain
    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team captain can update team'
      });
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating team'
    });
  }
};

/**
 * Delete team
 * @route DELETE /api/teams/:id
 * @access Private
 */
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is captain or admin
    if (team.captain.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete team'
      });
    }

    await team.remove();

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    logger.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting team'
    });
  }
};

/**
 * Add player to team
 * @route POST /api/teams/:id/players
 * @access Private
 */
exports.addPlayer = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    const user = await User.findById(req.body.userId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is team captain
    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team captain can add players'
      });
    }

    // Check if team is full
    if (team.players.length >= team.maxPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Team is full'
      });
    }

    // Check if player is already in team
    if (team.players.some(p => p.user.toString() === user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Player is already in team'
      });
    }

    team.players.push({
      user: user._id,
      role: req.body.role || 'player'
    });

    const updatedTeam = await team.save();

    res.status(200).json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding player to team'
    });
  }
};

/**
 * Remove player from team
 * @route DELETE /api/teams/:id/players/:playerId
 * @access Private
 */
exports.removePlayer = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team captain
    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team captain can remove players'
      });
    }

    // Remove player
    team.players = team.players.filter(
      player => player.user.toString() !== req.params.playerId
    );

    const updatedTeam = await team.save();

    res.status(200).json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    logger.error('Remove player error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing player'
    });
  }
};

/**
 * Update player role in team
 * @route PUT /api/teams/:id/players/:playerId
 * @access Private
 */
exports.updatePlayerRole = async (req, res) => {
  try {
    const { role } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is captain or admin
    if (team.captain.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update player roles'
      });
    }

    // Check if player is in team
    const playerIndex = team.players.findIndex(p => p.user.toString() === req.params.playerId);
    if (playerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Player not found in team'
      });
    }

    // Don't allow changing captain's role
    if (team.players[playerIndex].role === 'captain') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change captain role'
      });
    }

    team.players[playerIndex].role = role;
    await team.save();

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    logger.error('Update player role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating player role'
    });
  }
}; 