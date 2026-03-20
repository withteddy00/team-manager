import express from 'express';
import ExcelJS from 'exceljs';
import Event from '../models/Event.js';
import Confirmation from '../models/Confirmation.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET /api/exports/excel
router.get('/excel', async (req, res) => {
  try {
    const { event_type, date_from, date_to, month, year } = req.query;
    
    const query = {};
    
    if (event_type) {
      query.type = event_type;
    }
    
    if (year) {
      const startDate = new Date(Number(year), 0, 1);
      const endDate = new Date(Number(year), 11, 31);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (month) {
      const startDate = new Date(Number(year) || new Date().getFullYear(), Number(month) - 1, 1);
      const endDate = new Date(Number(year) || new Date().getFullYear(), Number(month), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const events = await Event.find(query)
      .populate('assignedOperators', 'name')
      .sort({ date: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historique');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Titre', key: 'title', width: 30 },
      { header: 'Montant', key: 'amount', width: 15 },
      { header: 'Opérateurs', key: 'operators', width: 30 },
    ];

    for (const event of events) {
      const operators = event.assignedOperators
        .map((op: any) => op.name)
        .join(', ');
      
      worksheet.addRow({
        date: new Date(event.date).toLocaleDateString('fr-FR'),
        type: event.type === 'holiday' ? 'Congé' : 'Astreinte',
        title: event.title || event.holidayName || '-',
        amount: event.amount || 0,
        operators: operators || '-',
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=historique.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Error exporting data' });
  }
});

// GET /api/exports/pdf
router.get('/pdf', async (req, res) => {
  try {
    const { event_type, date_from, date_to, month, year } = req.query;
    
    // For now, return a simple text response
    // PDF generation would require additional libraries like pdfkit
    res.status(501).json({ message: 'PDF export not yet implemented' });
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Error exporting PDF' });
  }
});

export default router;
