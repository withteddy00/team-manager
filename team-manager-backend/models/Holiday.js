import mongoose from 'mongoose';

const holidayPaymentSchema = new mongoose.Schema({
  holiday_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Holiday' },
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
  amount: { type: Number, default: 0 },
  member_name: { type: String, default: null }
}, { timestamps: { createdAt: 'created_at' } });

const holidaySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  holiday_name: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    default: 'MA'
  },
  auto_detected: {
    type: Boolean,
    default: false
  },
  worked: {
    type: Boolean,
    default: null
  },
  comment: {
    type: String,
    default: null
  },
  validated_by: {
    type: String,
    default: null
  },
  validated_at: {
    type: String,
    default: null
  },
  payments: [holidayPaymentSchema]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Holiday = mongoose.model('Holiday', holidaySchema);
export default Holiday;
