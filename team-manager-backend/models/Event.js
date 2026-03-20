import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['holiday', 'astreinte'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // For astreinte - selected operators for Sunday duty
  assignedOperators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Amount to be paid (1000 MAD)
  amount: {
    type: Number,
    default: 1000
  },
  // Reference to Morocco holiday API
  isMoroccoHoliday: {
    type: Boolean,
    default: false
  },
  holidayName: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
