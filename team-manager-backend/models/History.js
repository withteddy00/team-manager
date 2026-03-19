import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    required: true,
    enum: ['holiday', 'egypt_duty']
  },
  event_name: {
    type: String,
    required: true
  },
  members: [{
    type: String
  }],
  amount_per_person: {
    type: Number,
    default: 0
  },
  total_amount: {
    type: Number,
    default: 0
  },
  validation_status: {
    type: String,
    enum: ['pending', 'validated', 'rejected'],
    default: 'pending'
  },
  comment: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const History = mongoose.model('History', historySchema);
export default History;
