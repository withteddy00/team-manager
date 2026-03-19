import Holiday from '../models/Holiday.js';
import EgyptDuty from '../models/EgyptDuty.js';
import TeamMember from '../models/TeamMember.js';

// GET /api/dashboard/stats
export const stats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    // Get holidays
    const holidays = await Holiday.find({
      date: { $regex: `^${currentYear}` }
    });

    // Get Egypt duties
    const egyptDuties = await EgyptDuty.find({
      date: { $regex: `^${currentYear}` }
    });

    // Get all members
    const allMembers = await TeamMember.find();
    const activeMembers = await TeamMember.find({ status: 'active' });

    // Calculate totals
    const totalHolidaysDeclared = holidays.length;
    const workedHolidays = holidays.filter(h => h.worked === true).length;
    const totalEgyptDuties = egyptDuties.length;

    // Calculate payments
    let totalHolidayPayments = 0;
    let totalEgyptPayments = 0;
    holidays.forEach(h => {
      h.payments?.forEach(p => {
        totalHolidayPayments += p.amount || 0;
      });
    });
    egyptDuties.forEach(d => {
      d.beneficiaries?.forEach(b => {
        totalEgyptPayments += b.amount || 0;
      });
    });

    const totalPayments = totalHolidayPayments + totalEgyptPayments;

    // Member totals
    const memberTotals = activeMembers.map(m => {
      let holidayTotal = 0;
      let egyptTotal = 0;

      holidays.forEach(h => {
        const payment = h.payments?.find(p => p.member_id?.toString() === m._id.toString());
        if (payment) holidayTotal += payment.amount || 0;
      });

      egyptDuties.forEach(d => {
        const beneficiary = d.beneficiaries?.find(b => b.member_id?.toString() === m._id.toString());
        if (beneficiary) egyptTotal += beneficiary.amount || 0;
      });

      return {
        member_id: m._id,
        member_name: m.full_name,
        status: m.status,
        holiday_total: holidayTotal,
        egypt_total: egyptTotal,
        total: holidayTotal + egyptTotal
      };
    });

    // Monthly totals
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthlyTotals = [];

    for (let month = 1; month <= 12; month++) {
      const monthStr = String(month).padStart(2, '0');
      const monthHolidays = holidays.filter(h => h.date.startsWith(`${currentYear}-${monthStr}`));
      const monthDuties = egyptDuties.filter(d => d.date.startsWith(`${currentYear}-${monthStr}`));

      let holidayTotal = 0;
      let egyptTotal = 0;

      monthHolidays.forEach(h => {
        h.payments?.forEach(p => {
          holidayTotal += p.amount || 0;
        });
      });
      monthDuties.forEach(d => {
        d.beneficiaries?.forEach(b => {
          egyptTotal += b.amount || 0;
        });
      });

      monthlyTotals.push({
        month,
        month_name: monthNames[month - 1],
        holiday_total: holidayTotal,
        egypt_total: egyptTotal,
        total: holidayTotal + egyptTotal
      });
    }

    res.json({
      total_holidays_declared: totalHolidaysDeclared,
      worked_holidays: workedHolidays,
      total_egypt_duties: totalEgyptDuties,
      total_payments: totalPayments,
      total_holiday_payments: totalHolidayPayments,
      total_egypt_payments: totalEgyptPayments,
      active_members: activeMembers.length,
      total_members: allMembers.length,
      member_totals: memberTotals,
      monthly_totals: monthlyTotals
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
