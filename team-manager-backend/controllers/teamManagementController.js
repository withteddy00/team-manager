import Team from '../models/Team.js';
import User from '../models/User.js';

// CREATE TEAM - Superviseur creates their team
export const createTeam = async (req, res) => {
  try {
    const { name } = req.body;
    const superviseurId = req.user._id;

    if (req.user.role !== 'superviseur' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only superviseurs can create teams' });
    }

    // Check if superviseur already has a team
    const existingTeam = await Team.findOne({ superviseurId });
    if (existingTeam) {
      return res.status(400).json({ message: 'You already have a team' });
    }

    const team = await Team.create({ name, superviseurId, members: [] });

    // Update user's teamId
    await User.findByIdAndUpdate(superviseurId, { teamId: team._id });

    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET MY TEAM - Get team for logged in superviseur
export const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ superviseurId: req.user._id })
      .populate('members', 'name email role totalSalary');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET TEAM BY ID
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email role totalSalary')
      .populate('superviseurId', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADD OPERATOR TO TEAM
export const addOperatorToTeam = async (req, res) => {
  try {
    const { operatorId } = req.body;
    const superviseurId = req.user._id;

    // Get superviseur's team
    const team = await Team.findOne({ superviseurId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if operator exists
    const operator = await User.findById(operatorId);
    if (!operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    if (operator.role !== 'operateur') {
      return res.status(400).json({ message: 'User must be an operateur' });
    }

    // Check if already in team
    if (team.members.includes(operatorId)) {
      return res.status(400).json({ message: 'Operator already in team' });
    }

    // Add to team
    team.members.push(operatorId);
    await team.save();

    // Update operator's superviseurId and teamId
    await User.findByIdAndUpdate(operatorId, { 
      superviseurId, 
      teamId: team._id 
    });

    const updatedTeam = await Team.findById(team._id)
      .populate('members', 'name email role totalSalary');

    res.json(updatedTeam);
  } catch (error) {
    console.error('Add operator error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// REMOVE OPERATOR FROM TEAM
export const removeOperatorFromTeam = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const superviseurId = req.user._id;

    // Get superviseur's team
    const team = await Team.findOne({ superviseurId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if operator in team
    if (!team.members.includes(operatorId)) {
      return res.status(400).json({ message: 'Operator not in team' });
    }

    // Remove from team
    team.members = team.members.filter(m => m.toString() !== operatorId);
    await team.save();

    // Update operator's superviseurId and teamId
    await User.findByIdAndUpdate(operatorId, { 
      superviseurId: null, 
      teamId: null 
    });

    const updatedTeam = await Team.findById(team._id)
      .populate('members', 'name email role totalSalary');

    res.json(updatedTeam);
  } catch (error) {
    console.error('Remove operator error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET ALL TEAMS (Admin only)
export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('members', 'name email role totalSalary')
      .populate('superviseurId', 'name email');

    res.json(teams);
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL OPERATORS (for superviseur to add)
export const getAvailableOperators = async (req, res) => {
  try {
    const operators = await User.find({ 
      role: 'operateur',
      superviseurId: null,
      teamId: null
    }).select('name email');

    res.json(operators);
  } catch (error) {
    console.error('Get operators error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
