import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

// ==================== ADMIN USER MANAGEMENT ====================

// GET ALL USERS (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can access this' });
    }

    const users = await User.find()
      .select('-password')
      .populate('teamId', 'name')
      .populate('superviseurId', 'name')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET PENDING OPERATEURS (Admin only)
export const getPendingOperateurs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can access this' });
    }

    const pendingUsers = await User.find({ 
      role: 'operateur',
      validationStatus: 'pending'
    })
      .select('-password')
      .populate('teamId', 'name')
      .populate('superviseurId', 'name email');

    res.json(pendingUsers);
  } catch (error) {
    console.error('Get pending operateurs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE USER (Admin only)
export const createUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create users' });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate role
    const validRoles = ['admin', 'superviseur'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if email exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: role || 'superviseur',
      validationStatus: 'approved' // Admin-created users are approved by default
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      validationStatus: user.validationStatus,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// VALIDATE OPERATEUR (Admin only) - Approve or reject
export const validateOperateur = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can validate operateurs' });
    }

    const { userId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'operateur') {
      return res.status(400).json({ message: 'User is not an operateur' });
    }

    if (action === 'approve') {
      user.validationStatus = 'approved';
      await user.save();
    } else if (action === 'reject') {
      user.validationStatus = 'rejected';
      await user.save();
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      validationStatus: user.validationStatus
    });
  } catch (error) {
    console.error('Validate operateur error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// DELETE USER (Admin only)
export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete users' });
    }

    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET SUPERVISEURS (for admin to create teams)
export const getSuperviseurs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can access this' });
    }

    const superviseurs = await User.find({ role: 'superviseur' })
      .select('name email teamId validationStatus')
      .populate('teamId', 'name');

    res.json(supervisers);
  } catch (error) {
    console.error('Get superviseurs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== LOGIN ====================

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

    // Check if user is approved
    if (user.validationStatus === 'pending') {
      return res.status(403).json({ message: 'Your account is pending approval' });
    }

    if (user.validationStatus === 'rejected') {
      return res.status(403).json({ message: 'Your account has been rejected' });
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
        validationStatus: user.validationStatus,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('teamId', 'name')
      .populate('superviseurId', 'name email');
    
    res.json(user);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
