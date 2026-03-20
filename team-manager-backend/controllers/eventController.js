import Event from '../models/Event.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Confirmation from '../models/Confirmation.js';
import Notification from '../models/Notification.js';

// FETCH MOROCCO HOLIDAYS - Get holidays from external API
export const fetchMoroccoHolidays = async (year) => {
  try {
    // Using a free holidays API - returns holidays for Morocco
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/MA`);
    if (!response.ok) {
      throw new Error('Failed to fetch holidays');
    }
    const holidays = await response.json();
    return holidays;
  } catch (error) {
    console.error('Error fetching Morocco holidays:', error);
    return [];
  }
};

// SYNC HOLIDAYS - Admin can sync Morocco holidays to system
export const syncMoroccoHolidays = async (req, res) => {
  try {
    const { year } = req.body;
    const currentYear = year || new Date().getFullYear();

    const moroccoHolidays = await fetchMoroccoHolidays(currentYear);
    
    const savedEvents = [];
    
    for (const holiday of moroccoHolidays) {
      // Check if already exists
      const existing = await Event.findOne({ 
        date: new Date(holiday.date),
        type: 'holiday'
      });
      
      if (!existing) {
        const event = await Event.create({
          title: holiday.name,
          type: 'holiday',
          date: new Date(holiday.date),
          isMoroccoHoliday: true,
          holidayName: holiday.name,
          amount: 1000
        });
        savedEvents.push(event);

        // Notify all superviseurs
        const superviseurs = await User.find({ role: 'superviseur' });
        for (const superviseur of superviseurs) {
          await Notification.create({
            userId: superviseur._id,
            title: 'Nouvel événement',
            message: ` Jour férié: ${holiday.name} le ${new Date(holiday.date).toLocaleDateString('fr-FR')}`,
            type: 'holiday'
          });
        }
      }
    }

    res.json({ 
      message: `Synchronisé ${savedEvents.length} jours fériés`,
      events: savedEvents 
    });
  } catch (error) {
    console.error('Sync holidays error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET ALL EVENTS
export const getAllEvents = async (req, res) => {
  try {
    const { type, year, month } = req.query;
    let query = {};

    if (type) {
      query.type = type;
    }

    if (year || month) {
      const startDate = new Date(year || new Date().getFullYear(), (month || 1) - 1, 1);
      const endDate = new Date(year || new Date().getFullYear(), month || 12, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const events = await Event.find(query).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MY EVENTS - For superviseur (their team's events)
export const getMyEvents = async (req, res) => {
  try {
    const superviseurId = req.user._id;
    
    // Get superviseur's team
    const team = await Team.findOne({ superviseurId });
    if (!team) {
      return res.json([]);
    }

    // Get all events
    const events = await Event.find().sort({ date: 1 });
    
    // Add info about whether user is assigned
    const eventsWithAssignment = events.map(event => {
      const isAssigned = event.assignedOperators.includes(superviseurId) || 
        team.members.some(m => event.assignedOperators.includes(m));
      return {
        ...event.toObject(),
        isAssigned
      };
    });

    res.json(eventsWithAssignment);
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE ASTREINTE (Sunday duty) - System creates automatically or admin
export const createAstreinte = async (req, res) => {
  try {
    const { date } = req.body;
    const eventDate = new Date(date);

    // Check if it's Sunday
    const dayOfWeek = eventDate.getDay();
    if (dayOfWeek !== 0) {
      return res.status(400).json({ message: 'Astreinte must be on a Sunday' });
    }

    // Check if already exists
    const existing = await Event.findOne({ 
      date: eventDate,
      type: 'astreinte'
    });

    if (existing) {
      return res.status(400).json({ message: 'Astreinte already exists for this date' });
    }

    const event = await Event.create({
      title: 'Astreinte (Garde)',
      type: 'astreinte',
      date: eventDate,
      amount: 1000
    });

    // Notify all superviseurs
    const superviseurs = await User.find({ role: 'superviseur' });
    for (const superviseur of superviseurs) {
      await Notification.create({
        userId: superviseur._id,
        title: 'Nouvelle astreinte',
        message: `Selectionnez 3 opérateurs pour l'astreinte du ${eventDate.toLocaleDateString('fr-FR')}`,
        type: 'astreinte',
        eventId: event._id
      });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Create astreinte error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ASSIGN OPERATORS TO ASTREINTE - Superviseur selects 3 operators
export const assignOperatorsToAstreinte = async (req, res) => {
  try {
    const { eventId, operatorIds } = req.body;
    const superviseurId = req.user._id;

    if (!operatorIds || operatorIds.length !== 3) {
      return res.status(400).json({ message: 'Must select exactly 3 operators' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.type !== 'astreinte') {
      return res.status(400).json({ message: 'This event is not an astreinte' });
    }

    // Verify superviseur's team has these operators
    const team = await Team.findOne({ superviseurId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    for (const opId of operatorIds) {
      if (!team.members.includes(opId)) {
        return res.status(400).json({ message: 'Operator not in your team' });
      }
    }

    // Update event with assigned operators
    event.assignedOperators = operatorIds;
    await event.save();

    // Create confirmation request
    const confirmation = await Confirmation.create({
      eventId: event._id,
      submittedBy: superviseurId,
      status: 'pending',
      selectedOperators: operatorIds
    });

    res.json({ event, confirmation });
  } catch (error) {
    console.error('Assign operators error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// SUBMIT HOLIDAY CONFIRMATION - Superviseur confirms holiday for their team
export const submitHolidayConfirmation = async (req, res) => {
  try {
    const { eventId } = req.body;
    const superviseurId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.type !== 'holiday') {
      return res.status(400).json({ message: 'This event is not a holiday' });
    }

    // Get superviseur's team
    const team = await Team.findOne({ superviseurId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Create confirmation with all team members + superviseur
    const confirmation = await Confirmation.create({
      eventId: event._id,
      submittedBy: superviseurId,
      status: 'pending',
      selectedOperators: team.members,
      superviseurPaid: false
    });

    res.status(201).json(confirmation);
  } catch (error) {
    console.error('Submit holiday confirmation error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET CONFIRMATIONS
export const getConfirmations = async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    const confirmations = await Confirmation.find(query)
      .populate('eventId')
      .populate('submittedBy', 'name email')
      .populate('selectedOperators', 'name email')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    // Filter by event type if needed
    let filtered = confirmations;
    if (type) {
      const eventIds = confirmations.map(c => c.eventId?._id);
      const events = await Event.find({ _id: { $in: eventIds }, type });
      const validEventIds = events.map(e => e._id.toString());
      filtered = confirmations.filter(c => c.eventId && validEventIds.includes(c.eventId._id.toString()));
    }

    res.json(filtered);
  } catch (error) {
    console.error('Get confirmations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// APPROVE CONFIRMATION (Admin only)
export const approveConfirmation = async (req, res) => {
  try {
    const { confirmationId } = req.params;
    const adminId = req.user._id;

    const confirmation = await Confirmation.findById(confirmationId)
      .populate('eventId')
      .populate('selectedOperators');

    if (!confirmation) {
      return res.status(404).json({ message: 'Confirmation not found' });
    }

    if (confirmation.status !== 'pending') {
      return res.status(400).json({ message: 'Confirmation already processed' });
    }

    // Update confirmation
    confirmation.status = 'approved';
    confirmation.processedBy = adminId;
    await confirmation.save();

    // Get event
    const event = await Event.findById(confirmation.eventId._id);
    
    // Pay superviseur (1000 MAD)
    await User.findByIdAndUpdate(confirmation.submittedBy, {
      $inc: { totalSalary: event.amount }
    });
    confirmation.superviseurPaid = true;

    // Pay operators (1000 MAD each)
    for (const operatorId of confirmation.selectedOperators) {
      await User.findByIdAndUpdate(operatorId._id, {
        $inc: { totalSalary: event.amount }
      });
    }
    confirmation.paidOperators = confirmation.selectedOperators.map(op => op._id);

    await confirmation.save();

    res.json(confirmation);
  } catch (error) {
    console.error('Approve confirmation error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// REJECT CONFIRMATION (Admin only)
export const rejectConfirmation = async (req, res) => {
  try {
    const { confirmationId } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const confirmation = await Confirmation.findById(confirmationId);

    if (!confirmation) {
      return res.status(404).json({ message: 'Confirmation not found' });
    }

    if (confirmation.status !== 'pending') {
      return res.status(400).json({ message: 'Confirmation already processed' });
    }

    confirmation.status = 'rejected';
    confirmation.processedBy = adminId;
    confirmation.rejectionReason = reason;
    await confirmation.save();

    // Notify superviseur
    await Notification.create({
      userId: confirmation.submittedBy,
      title: 'Confirmation refusée',
      message: `Votre confirmation a été refusée${reason ? `: ${reason}` : ''}`,
      type: 'rejection'
    });

    res.json(confirmation);
  } catch (error) {
    console.error('Reject confirmation error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// GET MY CONFIRMATIONS - For superviseur/operateur
export const getMyConfirmations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let query = {};
    
    if (req.user.role === 'superviseur') {
      query.$or = [
        { submittedBy: userId },
        { selectedOperators: userId }
      ];
    } else if (req.user.role === 'operateur') {
      query.selectedOperators = userId;
    }

    const confirmations = await Confirmation.find(query)
      .populate('eventId')
      .populate('submittedBy', 'name email')
      .populate('selectedOperators', 'name email totalSalary')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(confirmations);
  } catch (error) {
    console.error('Get my confirmations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
