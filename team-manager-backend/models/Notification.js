import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['holiday', 'astreinte', 'confirmation', 'rejection', 'general'],
    default: 'general'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: null
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  confirmationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Confirmation',
    default: null
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
