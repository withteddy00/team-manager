import TeamMember from '../models/TeamMember.js';

// GET /api/team/
export const list = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const members = await TeamMember.find(query).sort({ created_at: -1 });
    res.json(members);
  } catch (error) {
    console.error('Team list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/team/:id
export const get = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    console.error('Team get error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/team/
export const create = async (req, res) => {
  try {
    const { full_name, position, phone, email, status } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    const member = await TeamMember.create({ full_name, position, phone, email, status: status || 'active' });
    res.status(201).json(member);
  } catch (error) {
    console.error('Team create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/team/:id
export const update = async (req, res) => {
  try {
    const { full_name, position, phone, email, status } = req.body;

    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (full_name) member.full_name = full_name;
    if (position !== undefined) member.position = position;
    if (phone !== undefined) member.phone = phone;
    if (email !== undefined) member.email = email;
    if (status) member.status = status;

    await member.save();
    res.json(member);
  } catch (error) {
    console.error('Team update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/team/:id
export const remove = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await member.deleteOne();
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Team delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/team/:id/toggle-status
export const toggleStatus = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.status = member.status === 'active' ? 'inactive' : 'active';
    await member.save();
    res.json(member);
  } catch (error) {
    console.error('Team toggleStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
