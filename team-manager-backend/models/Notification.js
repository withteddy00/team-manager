import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: null
  },
  event_date: {
    type: String,
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
