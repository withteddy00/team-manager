import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'superviseur', 'operateur'],
    default: 'operateur'
  },
  // Validation status for operateurs (pending/approved/rejected)
  validationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Default to approved for existing users
  },
  // For superviseur - reference to team they manage
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  // For operateur - reference to their superviseur
  superviseurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Salary tracking
  totalSalary: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
