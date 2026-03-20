import mongoose from 'mongoose';

const confirmationSchema = new mongoose.Schema({
  // Reference to the event
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  // Who submitted the confirmation (superviseur)
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Status: pending, approved, rejected
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Who approved/rejected (admin)
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Rejection reason if any
  rejectionReason: {
    type: String,
    default: null
  },
  // For astreinte - selected operators (3 operators)
  selectedOperators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Operators who received payment for this confirmation
  paidOperators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Superviseur received payment
  superviseurPaid: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Confirmation = mongoose.model('Confirmation', confirmationSchema);
export default Confirmation;
