import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    default: null,
    trim: true
  },
  phone: {
    type: String,
    default: null,
    trim: true
  },
  email: {
    type: String,
    default: null,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
export default TeamMember;
