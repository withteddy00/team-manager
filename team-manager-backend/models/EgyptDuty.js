import mongoose from 'mongoose';

const egyptBeneficiarySchema = new mongoose.Schema({
  duty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'EgyptDuty' },
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
  amount: { type: Number, default: 0 },
  member_name: { type: String, default: null }
}, { timestamps: { createdAt: 'created_at' } });

const egyptDutySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
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
  beneficiaries: [egyptBeneficiarySchema]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const EgyptDuty = mongoose.model('EgyptDuty', egyptDutySchema);
export default EgyptDuty;
