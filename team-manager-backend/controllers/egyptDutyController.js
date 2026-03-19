import EgyptDuty from '../models/EgyptDuty.js';
import TeamMember from '../models/TeamMember.js';

// Helper to check if date is Sunday
const isSunday = (dateStr) => {
  const date = new Date(dateStr);
  return date.getDay() === 0;
};

// Helper to get Sundays in a month
const getSundaysInMonth = (year, month) => {
  const sundays = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    if (date.getDay() === 0) {
      sundays.push(date.toISOString().split('T')[0]);
    }
    date.setDate(date.getDate() + 1);
  }
  return sundays;
};

// GET /api/egypt-duty/
export const list = async (req, res) => {
  try {
    const { year, month } = req.query;
    let query = {};

    if (year && month) {
      const monthStr = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${monthStr}` };
    } else if (year) {
      query.date = { $regex: `^${year}` };
    }

    const duties = await EgyptDuty.find(query).sort({ date: -1 });
    res.json(duties);
  } catch (error) {
    console.error('Egypt duty list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/egypt-duty/:id
export const get = async (req, res) => {
  try {
    const duty = await EgyptDuty.findById(req.params.id);
    if (!duty) {
      return res.status(404).json({ message: 'Egypt duty not found' });
    }
    res.json(duty);
  } catch (error) {
    console.error('Egypt duty get error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/egypt-duty/
export const create = async (req, res) => {
  try {
    const { date, member_ids, comment } = req.body;

    if (!date || !member_ids || !member_ids.length) {
      return res.status(400).json({ message: 'Date and member IDs are required' });
    }

    const members = await TeamMember.find({ _id: { $in: member_ids }, status: 'active' });
    
    const duty = await EgyptDuty.create({
      date,
      comment,
      beneficiaries: members.map(m => ({
        duty_id: null,
        member_id: m._id,
        amount: 0,
        member_name: m.full_name
      }))
    });

    // Update beneficiary duty_id
    duty.beneficiaries = duty.beneficiaries.map(b => ({
      ...b,
      duty_id: duty._id
    }));
    await duty.save();

    res.status(201).json(duty);
  } catch (error) {
    console.error('Egypt duty create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/egypt-duty/:id
export const update = async (req, res) => {
  try {
    const { member_ids, comment } = req.body;

    const duty = await EgyptDuty.findById(req.params.id);
    if (!duty) {
      return res.status(404).json({ message: 'Egypt duty not found' });
    }

    if (comment !== undefined) duty.comment = comment;

    if (member_ids) {
      const members = await TeamMember.find({ _id: { $in: member_ids }, status: 'active' });
      duty.beneficiaries = members.map(m => ({
        duty_id: duty._id,
        member_id: m._id,
        amount: 0,
        member_name: m.full_name
      }));
    }

    await duty.save();
    res.json(duty);
  } catch (error) {
    console.error('Egypt duty update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/egypt-duty/:id
export const remove = async (req, res) => {
  try {
    const duty = await EgyptDuty.findById(req.params.id);
    if (!duty) {
      return res.status(404).json({ message: 'Egypt duty not found' });
    }

    await duty.deleteOne();
    res.json({ message: 'Egypt duty removed' });
  } catch (error) {
    console.error('Egypt duty delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/egypt-duty/check-sunday/:date
export const checkSunday = async (req, res) => {
  try {
    const { date } = req.params;
    res.json({ is_sunday: isSunday(date) });
  } catch (error) {
    console.error('Check Sunday error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/egypt-duty/sundays/:year/:month
export const getSundays = async (req, res) => {
  try {
    const { year, month } = req.params;
    const sundays = getSundaysInMonth(parseInt(year), parseInt(month));
    res.json(sundays);
  } catch (error) {
    console.error('Get Sundays error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
