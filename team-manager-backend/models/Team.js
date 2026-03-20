import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  superviseurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Active operateurs (approved by admin)
  operateurs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Operateurs pending approval
  pendingOperateurs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for faster queries
teamSchema.index({ superviseurId: 1 });

const Team = mongoose.model('Team', teamSchema);
export default Team;
