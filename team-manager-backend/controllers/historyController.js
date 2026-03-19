import History from '../models/History.js';

// GET /api/history/
export const list = async (req, res) => {
  try {
    const { event_type, member_id, date_from, date_to, month, year, status } = req.query;
    let query = {};

    if (event_type) query.event_type = event_type;
    if (status) query.validation_status = status;
    
    if (date_from || date_to) {
      query.date = {};
      if (date_from) query.date.$gte = date_from;
      if (date_to) query.date.$lte = date_to;
    }

    if (month && year) {
      const monthStr = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${monthStr}` };
    } else if (year) {
      query.date = { $regex: `^${year}` };
    }

    const history = await History.find(query).sort({ date: -1 });
    res.json(history);
  } catch (error) {
    console.error('History list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
