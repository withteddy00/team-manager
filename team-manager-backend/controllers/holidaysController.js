import Holiday from '../models/Holiday.js';
import TeamMember from '../models/TeamMember.js';

// Moroccan holidays for a given year
const getMoroccanHolidays = (year) => [
  { date: `${year}-01-01`, name: "Nouvel An" },
  { date: `${year}-01-11`, name: "Manifeste de l'Indépendance" },
  { date: `${year}-05-01`, name: "Fête du Travail" },
  { date: `${year}-07-30`, name: "Fête du Trône" },
  { date: `${year}-08-14`, name: "Allegiance of Oued Eddahab" },
  { date: `${year}-08-20`, name: "Révolution du Roi et du Peuple" },
  { date: `${year}-11-06`, name: "Marche Verte" },
  { date: `${year}-11-18`, name: "Fête de l'Indépendance" }
];

// GET /api/holidays/
export const list = async (req, res) => {
  try {
    const { year, month, worked } = req.query;
    let query = {};

    if (year) {
      query.date = { $regex: `^${year}` };
    }
    if (month) {
      const monthStr = String(month).padStart(2, '0');
      query.date = { ...query.date, $regex: `^${year || '....'}-${monthStr}` };
    }
    if (worked !== undefined) {
      query.worked = worked === 'true' ? true : (worked === 'false' ? false : null);
    }

    const holidays = await Holiday.find(query).sort({ date: -1 });
    res.json(holidays);
  } catch (error) {
    console.error('Holidays list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/holidays/:id
export const get = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    res.json(holiday);
  } catch (error) {
    console.error('Holiday get error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/holidays/
export const create = async (req, res) => {
  try {
    const { date, holiday_name, country, auto_detected, comment } = req.body;

    if (!date || !holiday_name) {
      return res.status(400).json({ message: 'Date and holiday name are required' });
    }

    const holiday = await Holiday.create({
      date,
      holiday_name,
      country: country || 'MA',
      auto_detected: auto_detected || false,
      comment
    });

    // Create payments for all active members
    const members = await TeamMember.find({ status: 'active' });
    const payments = members.map(m => ({
      holiday_id: holiday._id,
      member_id: m._id,
      amount: 0,
      member_name: m.full_name
    }));
    holiday.payments = payments;
    await holiday.save();

    res.status(201).json(holiday);
  } catch (error) {
    console.error('Holiday create error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/holidays/:id
export const update = async (req, res) => {
  try {
    const { holiday_name, worked, comment } = req.body;

    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    if (holiday_name) holiday.holiday_name = holiday_name;
    if (worked !== undefined) holiday.worked = worked;
    if (comment !== undefined) holiday.comment = comment;

    await holiday.save();
    res.json(holiday);
  } catch (error) {
    console.error('Holiday update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/holidays/:id
export const remove = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    await holiday.deleteOne();
    res.json({ message: 'Holiday removed' });
  } catch (error) {
    console.error('Holiday delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/holidays/:id/validate
export const validate = async (req, res) => {
  try {
    const { worked, comment } = req.body;

    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    holiday.worked = worked;
    if (comment !== undefined) holiday.comment = comment;
    holiday.validated_by = req.user.name;
    holiday.validated_at = new Date().toISOString();

    await holiday.save();
    res.json(holiday);
  } catch (error) {
    console.error('Holiday validate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/holidays/moroccan/:year
export const getMoroccan = async (req, res) => {
  try {
    const { year } = req.params;
    const existingHolidays = await Holiday.find({ date: { $regex: `^${year}` } });
    const existingDates = new Set(existingHolidays.map(h => h.date));

    const moroccanHolidays = getMoroccanHolidays(parseInt(year)).map(h => ({
      date: h.date,
      name: h.name,
      auto_detected: existingDates.has(h.date)
    }));

    res.json(moroccanHolidays);
  } catch (error) {
    console.error('Moroccan holidays error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/holidays/sync/:year
export const sync = async (req, res) => {
  try {
    const { year } = req.params;
    const moroccanHolidays = getMoroccanHolidays(parseInt(year));

    const results = [];
    for (const h of moroccanHolidays) {
      const existing = await Holiday.findOne({ date: h.date });
      if (!existing) {
        const holiday = await Holiday.create({
          date: h.date,
          holiday_name: h.name,
          country: 'MA',
          auto_detected: true
        });
        results.push(holiday);
      }
    }

    res.json({ message: `Synced ${results.length} holidays`, holidays: results });
  } catch (error) {
    console.error('Holiday sync error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
