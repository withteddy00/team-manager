import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import teamManagementRoutes from './routes/teamManagementRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import holidaysRoutes from './routes/holidaysRoutes.js';
import egyptDutyRoutes from './routes/egyptDutyRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import Team from './models/Team.js';
import User from './models/User.js';

dotenv.config();

const app = express();

// Connect to MongoDB and create default teams
const initApp = async () => {
  await connectDB();
  
  // Create default teams if none exist
  const teamCount = await Team.countDocuments();
  if (teamCount === 0) {
    const defaultTeamNames = ['Équipe A', 'Équipe B', 'Équipe C', 'Équipe D'];
    
    // Find or create superviseur users for each team
    for (const teamName of defaultTeamNames) {
      // Check if a superviseur exists for this team
      const superviseurName = `${teamName} Superviseur`;
      let superviseur = await User.findOne({ name: superviseurName });
      
      if (!superviseur) {
        // Create superviseur user
        superviseur = await User.create({
          name: superviseurName,
          email: `${teamName.toLowerCase().replace(' ', '')}@team.local`,
          password: 'password123',
          role: 'superviseur',
          validated: true
        });
      }
      
      // Create team
      await Team.create({
        name: teamName,
        superviseurId: superviseur._id,
        operateurs: [],
        pendingOperateurs: []
      });
    }
    console.log('Default teams created');
  }
};

initApp().then(() => {
  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/team-management', teamManagementRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/holidays', holidaysRoutes);
  app.use('/api/egypt-duty', egyptDutyRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/events', eventRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
  });

  // Root route
  app.get('/', (req, res) => {
    res.send('Team Manager Backend API is running');
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
