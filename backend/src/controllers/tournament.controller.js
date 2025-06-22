const Tournament = require('../models/tournament.model');
const Team = require('../models/team.model');
const logger = require('../utils/logger');

/**
 * Create a new tournament
 * @route POST /api/tournaments
 * @access Private (Organizer, Admin)
 */
exports.createTournament = async (req, res) => {
  try {
    const tournament = await Tournament.create({
      ...req.body,
      organizer: req.user._id
    });

    res.status(201).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    logger.error('Create tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tournament'
    });
  }
};

/**
 * Get all tournaments
 * @route GET /api/tournaments
 * @access Public
 */
exports.getTournaments = async (req, res) => {
  try {
    const { sport } = req.query;
    const query = sport ? { sport } : {};
    
    const tournaments = await Tournament.find(query)
      .populate('organizer', 'name email')
      .populate('teams.team', 'name');

    res.status(200).json({
      success: true,
      data: tournaments
    });
  } catch (error) {
    logger.error('Get tournaments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournaments'
    });
  }
};

/**
 * Get single tournament
 * @route GET /api/tournaments/:id
 * @access Public
 */
exports.getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('teams.team', 'name');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    logger.error('Get tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournament'
    });
  }
};

/**
 * Update tournament
 * @route PUT /api/tournaments/:id
 * @access Private (Organizer, Admin)
 */
exports.updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is organizer or admin
    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update tournament'
      });
    }

    // Don't allow updating certain fields if tournament has started
    if (tournament.status !== 'draft' && tournament.status !== 'published') {
      const restrictedFields = ['format', 'maxTeams', 'minTeamsPerMatch', 'maxTeamsPerMatch', 'startDate'];
      const hasRestrictedFields = restrictedFields.some(field => req.body[field]);
      
      if (hasRestrictedFields) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update tournament format or team settings after tournament has started'
        });
      }
    }

    const updatedTournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedTournament
    });
  } catch (error) {
    logger.error('Update tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tournament'
    });
  }
};

/**
 * Delete tournament
 * @route DELETE /api/tournaments/:id
 * @access Private (Organizer, Admin)
 */
exports.deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is organizer or admin
    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete tournament'
      });
    }

    // Don't allow deleting if tournament is in progress
    if (tournament.status === 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tournament while it is in progress'
      });
    }

    await tournament.remove();

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    logger.error('Delete tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tournament'
    });
  }
};

/**
 * Register team for tournament
 * @route POST /api/tournaments/:id/register
 * @access Private (Team Captain)
 */
exports.registerTeam = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    const team = await Team.findById(req.body.teamId);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

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
        message: 'Only team captain can register team'
      });
    }

    // Check registration deadline
    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if tournament is full
    if (tournament.teams.length >= tournament.maxTeams) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is full'
      });
    }

    // Check if team is already registered
    if (tournament.teams.some(t => t.team.toString() === team._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Team is already registered'
      });
    }

    tournament.teams.push({
      team: team._id,
      registeredAt: Date.now()
    });

    const updatedTournament = await tournament.save();

    res.status(200).json({
      success: true,
      data: updatedTournament
    });
  } catch (error) {
    logger.error('Register team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering team'
    });
  }
};

/**
 * Update team registration status
 * @route PUT /api/tournaments/:id/teams/:teamId
 * @access Private (Organizer, Admin)
 */
exports.updateTeamStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is organizer or admin
    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update team status'
      });
    }

    const teamIndex = tournament.teams.findIndex(t => t.team.toString() === req.params.teamId);
    if (teamIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Team not found in tournament'
      });
    }

    tournament.teams[teamIndex].status = status;
    await tournament.save();

    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    logger.error('Update team status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating team status'
    });
  }
};

/**
 * Search tournaments
 * @route GET /api/tournaments/search
 * @access Public
 */
exports.searchTournaments = async (req, res) => {
  try {
    const { q, sport, status, startDate, endDate } = req.query;
    const query = {};

    if (q) {
      query.$text = { $search: q };
    }

    if (sport) {
      query.sport = sport.toLowerCase();
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startDate.$lte = new Date(endDate);
      }
    }

    const tournaments = await Tournament.find(query)
      .populate('organizer', 'name')
      .populate('teams.team', 'name')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      count: tournaments.length,
      data: tournaments
    });
  } catch (error) {
    logger.error('Search tournaments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching tournaments'
    });
  }
}; 