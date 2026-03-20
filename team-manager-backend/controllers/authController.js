import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

// GET SUPERVISEURS - Get all superviseurs (for admin to create teams)
export const getSuperviseurs = async (req, res) => {
  try {
    // Only admin can get superviseurs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can access this' });
    }

    const superviseurs = await User.find({ role: 'superviseur' })
      .select('name email teamId')
      .populate('teamId', 'name');

    res.json(superviseurs);
  } catch (error) {
    console.error('Get superviseurs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, superviseurId, teamId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate role
    const validRoles = ['admin', 'superviseur', 'operateur'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: role || 'operateur',
      superviseurId,
      teamId
    });

    res.status(201).json({
      access_token: generateToken(user._id),
      token_type: 'Bearer',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
        superviseurId: user.superviseurId,
        totalSalary: user.totalSalary,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      access_token: generateToken(user._id),
      token_type: 'Bearer',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
        superviseurId: user.superviseurId,
        totalSalary: user.totalSalary,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
      superviseurId: user.superviseurId,
      totalSalary: user.totalSalary,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
