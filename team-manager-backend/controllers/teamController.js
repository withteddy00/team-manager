import Team from '../models/Team.js';

// GET /api/team/ - List all teams (admin sees all, superviseur sees theirs)
export const list = async (req, res) => {
  try {
    const user = req.user;
    let teams;

    if (user.role === 'admin') {
      // Admin sees all teams with full details
      teams = await Team.find()
        .populate('superviseurId', 'name email')
        .populate('operateurs', 'name email')
        .populate('pendingOperateurs', 'name email')
        .sort({ createdAt: -1 });
    } else if (user.role === 'superviseur') {
      // Superviseur sees only their team
      teams = await Team.find({ superviseurId: user._id })
        .populate('superviseurId', 'name email')
        .populate('operateurs', 'name email')
        .populate('pendingOperateurs', 'name email');
    } else {
      // Operateur - find their team
      const team = await Team.findOne({
        $or: [
          { operateurs: user._id },
          { pendingOperateurs: user._id }
        ]
      })
        .populate('superviseurId', 'name email')
        .populate('operateurs', 'name email')
        .populate('pendingOperateurs', 'name email');
      teams = team ? [team] : [];
    }

    res.json(teams);
  } catch (error) {
    console.error('Team list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/team/:id - Get single team
export const get = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('superviseurId', 'name email')
      .populate('operateurs', 'name email')
      .populate('pendingOperateurs', 'name email');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    console.error('Team get error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/team/ - Create team (admin only)
export const create = async (req, res) => {
  try {
    const { name, superviseurId } = req.body;

    if (!name || !superviseurId) {
      return res.status(400).json({ message: 'Name and superviseur are required' });
    }

    const team = await Team.create({
      name,
      superviseurId,
      operateurs: [],
      pendingOperateurs: []
    });

    await team.populate('superviseurId', 'name email');
    res.status(201).json(team);
  } catch (error) {
    console.error('Team create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/team/:id - Update team
export const update = async (req, res) => {
  try {
    const { name, superviseurId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (name) team.name = name;
    if (superviseurId) team.superviseurId = superviseurId;

    await team.save();
    await team.populate('superviseurId', 'name email');
    await team.populate('operateurs', 'name email');
    res.json(team);
  } catch (error) {
    console.error('Team update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/team/:id - Delete team (admin only)
export const remove = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    await team.deleteOne();
    res.json({ message: 'Team removed' });
  } catch (error) {
    console.error('Team delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/team/:id/add-operateur - Add operateur to team (superviseur only)
export const addOperateur = async (req, res) => {
  try {
    const { operateurId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if superviseur owns this team
    if (team.superviseurId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add to pending operateurs
    if (!team.pendingOperateurs.includes(operateurId) && !team.operateurs.includes(operateurId)) {
      team.pendingOperateurs.push(operateurId);
      await team.save();
    }

    await team.populate('superviseurId', 'name email');
    await team.populate('operateurs', 'name email');
    await team.populate('pendingOperateurs', 'name email');
    res.json(team);
  } catch (error) {
    console.error('Team addOperateur error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/team/:id/approve-operateur - Approve operateur (admin only)
export const approveOperateur = async (req, res) => {
  try {
    const { operateurId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Remove from pending, add to operateurs
    team.pendingOperateurs = team.pendingOperateurs.filter(id => id.toString() !== operateurId);
    if (!team.operateurs.includes(operateurId)) {
      team.operateurs.push(operateurId);
    }
    await team.save();

    await team.populate('superviseurId', 'name email');
    await team.populate('operateurs', 'name email');
    await team.populate('pendingOperateurs', 'name email');
    res.json(team);
  } catch (error) {
    console.error('Team approveOperateur error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/team/:id/reject-operateur - Reject operateur (admin only)
export const rejectOperateur = async (req, res) => {
  try {
    const { operateurId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Remove from pending
    team.pendingOperateurs = team.pendingOperateurs.filter(id => id.toString() !== operateurId);
    await team.save();

    await team.populate('superviseurId', 'name email');
    await team.populate('operateurs', 'name email');
    await team.populate('pendingOperateurs', 'name email');
    res.json(team);
  } catch (error) {
    console.error('Team rejectOperateur error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
