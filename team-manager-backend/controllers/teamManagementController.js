import Team from '../models/Team.js';
import User from '../models/User.js';

// ==================== ADMIN ROUTES ====================

// CREATE TEAM (Admin only) - Max 4 teams
export const createTeam = async (req, res) => {
  try {
    const { name, superviseurId } = req.body;

    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create teams' });
    }

    if (!name || !superviseurId) {
      return res.status(400).json({ message: 'Team name and superviseur are required' });
    }

    // Check max 4 teams
    const teamCount = await Team.countDocuments();
    if (teamCount >= 4) {
      return res.status(400).json({ message: 'Maximum of 4 teams allowed' });
    }

    // Verify superviseur exists
    const superviseur = await User.findById(superviseurId);
    if (!superviseur || superviseur.role !== 'superviseur') {
      return res.status(400).json({ message: 'Invalid superviseur' });
    }

    // Check if superviseur already has a team
    const existingTeam = await Team.findOne({ superviseurId });
    if (existingTeam) {
      return res.status(400).json({ message: 'Superviseur already has a team' });
    }

    const team = await Team.create({ 
      name, 
      superviseurId,
      operateurs: [],
      pendingOperateurs: []
    });

    // Update superviseur's teamId
    await User.findByIdAndUpdate(superviseurId, { teamId: team._id });

    const populatedTeam = await Team.findById(team._id)
      .populate('superviseurId', 'name email')
      .populate('operateurs', 'name email validationStatus')
      .populate('pendingOperateurs', 'name email validationStatus');

    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET ALL TEAMS (Admin only)
export const getAllTeams = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can view all teams' });
    }

    const teams = await Team.find()
      .populate('superviseurId', 'name email')
      .populate('operateurs', 'name email validationStatus totalSalary')
      .populate('pendingOperateurs', 'name email validationStatus')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// APPROVE/REJECT OPERATEUR (Admin only)
export const validateOperateur = async (req, res) => {
  try {
    const { teamId, operateurId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can validate operateurs' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if operateur is in pending
    const isPending = team.pendingOperateurs.some(
      op => op.toString() === operateurId
    );

    if (!isPending) {
      return res.status(400).json({ message: 'Operateur not in pending list' });
    }

    if (action === 'approve') {
      // Move from pending to operateurs
      team.pendingOperateurs = team.pendingOperateurs.filter(
        op => op.toString() !== operateurId
      );
      team.operateurs.push(operateurId);
      await team.save();

      // Update user status
      await User.findByIdAndUpdate(operateurId, { 
        validationStatus: 'approved' 
      });
    } else if (action === 'reject') {
      // Remove from pending
      team.pendingOperateurs = team.pendingOperateurs.filter(
        op => op.toString() !== operateurId
      );
      await team.save();

      // Update user status and remove from team
      await User.findByIdAndUpdate(operateurId, { 
        validationStatus: 'rejected',
        superviseurId: null,
        teamId: null
      });
    }

    const updatedTeam = await Team.findById(teamId)
      .populate('superviseurId', 'name email')
      .populate('operateurs', 'name email validationStatus totalSalary')
      .populate('pendingOperateurs', 'name email validationStatus');

    res.json(updatedTeam);
  } catch (error) {
    console.error('Validate operateur error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// DELETE TEAM (Admin only)
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete teams' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Remove team reference from all members
    await User.updateMany(
      { teamId: teamId },
      { teamId: null, superviseurId: null, validationStatus: 'approved' }
    );

    await Team.findByIdAndDelete(teamId);

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ==================== SUPERVISEUR ROUTES ====================

// GET MY TEAM - Get team for logged in superviseur
export const getMyTeam = async (req, res) => {
  try {
    if (req.user.role !== 'superviseur') {
      return res.status(403).json({ message: 'Only superviseurs can access this' });
    }

    const team = await Team.findOne({ superviseurId: req.user._id })
      .populate('superviseurId', 'name email')
      .populate('operateurs', 'name email validationStatus totalSalary')
      .populate('pendingOperateurs', 'name email validationStatus');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET TEAM BY ID - Superviseur can only get their own team
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('superviseurId', 'name email')
      .populate('operateurs', 'name email validationStatus totalSalary')
      .populate('pendingOperateurs', 'name email validationStatus');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Superviseur can only access their own team
    if (req.user.role === 'superviseur') {
      if (team.superviseurId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only access your own team' });
      }
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADD OPERATOR TO TEAM (Superviseur adds - creates as pending)
export const addOperatorToTeam = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const superviseurId = req.user._id;

    if (req.user.role !== 'superviseur') {
      return res.status(403).json({ message: 'Only superviseurs can add operators' });
    }

    // Get superviseur's team
    const team = await Team.findOne({ superviseurId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create operateur with pending status
    const operateur = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      password,
      role: 'operateur',
      superviseurId,
      teamId: team._id,
      validationStatus: 'pending'
    });

    // Add to pending operateurs
    team.pendingOperateurs.push(operateur._id);
    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('superviseurId', 'name email')
      .populate('operateurs', 'name email validationStatus totalSalary')
      .populate('pendingOperateurs', 'name email validationStatus');

    res.status(201).json(updatedTeam);
  } catch (error) {
    console.error('Add operator error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// REMOVE OPERATOR FROM TEAM (Superviseur can remove approved operateurs)
export const removeOperatorFromTeam = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const superviseurId = req.user._id;

    if (req.user.role !== 'superviseur') {
      return res.status(403).json({ message: 'Only superviseurs can remove operators' });
    }

    // Get superviseur's team
    const team = await Team.findOne({ superviseurId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if operator in operateurs list
    const isOperateur = team.operateurs.some(
      op => op.toString() === operatorId
    );

    if (!isOperateur) {
      return res.status(400).json({ message: 'Operator not in team' });
    }

    // Remove from operateurs
    team.operateurs = team.operateurs.filter(op => op.toString() !== operatorId);
    await team.save();

    // Update operator's references
    await User.findByIdAndUpdate(operatorId, { 
      superviseurId: null, 
      teamId: null,
      validationStatus: 'approved'
    });

    const updatedTeam = await Team.findById(team._id)
      .populate('superviseurId', 'name email')
      .populate('operateurs', 'name email validationStatus totalSalary')
      .populate('pendingOperateurs', 'name email validationStatus');

    res.json(updatedTeam);
  } catch (error) {
    console.error('Remove operator error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET AVAILABLE OPERATORS (for backward compatibility)
export const getAvailableOperators = async (req, res) => {
  try {
    const operators = await User.find({ 
      role: 'operateur',
      $or: [
        { superviseurId: null },
        { teamId: null }
      ]
    }).select('name email validationStatus');

    res.json(operators);
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET OPERATEURS PENDING APPROVAL (Superviseur views pending)
export const getPendingOperateurs = async (req, res) => {
  try {
    if (req.user.role !== 'superviseur') {
      return res.status(403).json({ message: 'Only superviseurs can access this' });
    }

    const team = await Team.findOne({ superviseurId: req.user._id })
      .populate('pendingOperateurs', 'name email created_at');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team.pendingOperateurs || []);
  } catch (error) {
    console.error('Get pending operateurs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
