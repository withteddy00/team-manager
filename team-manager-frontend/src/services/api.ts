import axios from 'axios';

// Use proxy in dev, direct URL in production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    console.log('[API] Adding Authorization header');
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
  
  // Admin user management
  getAllUsers: () => api.get('/api/auth/users'),
  getPendingOperateurs: () => api.get('/api/auth/users/pending'),
  createUser: (name: string, email: string, password: string, role: string) =>
    api.post('/api/auth/users', { name, email, password, role }),
  validateOperateur: (userId: string, action: 'approve' | 'reject') =>
    api.put(`/api/auth/users/${userId}/validate`, { action }),
  deleteUser: (userId: string) => api.delete(`/api/auth/users/${userId}`),
  getSuperviseurs: () => api.get('/api/auth/superviseurs'),
};

// Team Management (new - superviseur manages team)
export const teamManagementAPI = {
  // Admin routes
  createTeam: (name: string, superviseurId: string) => 
    api.post('/api/team-management/', { name, superviseurId }),
  getAllTeams: () => api.get('/api/team-management/all'),
  validateOperateur: (teamId: string, operateurId: string, action: 'approve' | 'reject') =>
    api.put(`/api/team-management/${teamId}/validate/${operateurId}`, { action }),
  deleteTeam: (teamId: string) => api.delete(`/api/team-management/${teamId}`),
  
  // Superviseur routes
  getMyTeam: () => api.get('/api/team-management/my-team'),
  getPendingOperateurs: () => api.get('/api/team-management/my-team/pending'),
  addOperator: (name: string, email: string, password: string) => 
    api.post('/api/team-management/add-operator', { name, email, password }),
  removeOperator: (operatorId: string) => 
    api.delete(`/api/team-management/remove-operator/${operatorId}`),
  getAvailableOperators: () => api.get('/api/team-management/available-operators'),
  getTeamById: (id: string) => api.get(`/api/team-management/${id}`),
};

// Events
export const eventsAPI = {
  getAll: (params?: { type?: string; year?: number; month?: number }) =>
    api.get('/api/events/', { params }),
  getMyEvents: () => api.get('/api/events/my-events'),
  syncHolidays: (year: number) => api.post('/api/events/sync-holidays', { year }),
  createAstreinte: (date: string) => api.post('/api/events/astreinte', { date }),
  assignOperators: (eventId: string, operatorIds: string[]) => 
    api.post('/api/events/astreinte/assign', { eventId, operatorIds }),
  submitHolidayConfirmation: (eventId: string) => 
    api.post('/api/events/holiday/confirm', { eventId }),
  getConfirmations: (params?: { status?: string; type?: string }) =>
    api.get('/api/events/confirmations', { params }),
  getMyConfirmations: () => api.get('/api/events/confirmations/my'),
  approveConfirmation: (confirmationId: string) => 
    api.put(`/api/events/confirmations/${confirmationId}/approve`),
  rejectConfirmation: (confirmationId: string, reason?: string) => 
    api.put(`/api/events/confirmations/${confirmationId}/reject`, { reason }),
};

// Team (real teams with superviseur and operateurs)
export const teamAPI = {
  list: () => api.get('/api/team/'),
  get: (id: string) => api.get(`/api/team/${id}`),
  create: (data: { name: string; superviseurId: string }) =>
    api.post('/api/team/', data),
  update: (id: string, data: { name?: string; superviseurId?: string }) =>
    api.put(`/api/team/${id}`, data),
  delete: (id: string) => api.delete(`/api/team/${id}`),
  // Operateur management
  addOperateur: (teamId: string, operateurId: string) =>
    api.patch(`/api/team/${teamId}/add-operateur`, { operateurId }),
  approveOperateur: (teamId: string, operateurId: string) =>
    api.patch(`/api/team/${teamId}/approve-operateur`, { operateurId }),
  rejectOperateur: (teamId: string, operateurId: string) =>
    api.patch(`/api/team/${teamId}/reject-operateur`, { operateurId }),
};

// Holidays
export const holidaysAPI = {
  list: (params?: { year?: number; month?: number; worked?: boolean }) =>
    api.get('/api/holidays/', { params }),
  get: (id: number) => api.get(`/api/holidays/${id}`),
  create: (data: { date: string; holiday_name: string; country?: string; auto_detected?: boolean; comment?: string }) =>
    api.post('/api/holidays/', data),
  validate: (id: number, data: { worked: boolean; comment?: string }) =>
    api.post(`/api/holidays/${id}/validate`, data),
  update: (id: number, data: { holiday_name?: string; worked?: boolean; comment?: string }) =>
    api.put(`/api/holidays/${id}`, data),
  delete: (id: number) => api.delete(`/api/holidays/${id}`),
  getMoroccan: (year: number) => api.get(`/api/holidays/moroccan/${year}`),
  sync: (year: number) => api.post(`/api/holidays/sync/${year}`),
};

// Egypt Duty
export const egyptDutyAPI = {
  list: (params?: { year?: number; month?: number }) =>
    api.get('/api/egypt-duty/', { params }),
  get: (id: number) => api.get(`/api/egypt-duty/${id}`),
  create: (data: { date: string; member_ids: number[]; comment?: string }) =>
    api.post('/api/egypt-duty/', data),
  update: (id: number, data: { member_ids?: number[]; comment?: string }) =>
    api.put(`/api/egypt-duty/${id}`, data),
  delete: (id: number) => api.delete(`/api/egypt-duty/${id}`),
  checkSunday: (date: string) => api.get(`/api/egypt-duty/check-sunday/${date}`),
  getSundays: (year: number, month: number) =>
    api.get(`/api/egypt-duty/sundays/${year}/${month}`),
};

// History
export const historyAPI = {
  list: (params?: {
    event_type?: string;
    member_id?: number;
    date_from?: string;
    date_to?: string;
    month?: number;
    year?: number;
    status?: string;
  }) => api.get('/api/history/', { params }),
};

// Notifications
export const notificationsAPI = {
  list: () => api.get('/api/notifications/'),
  unreadCount: () => api.get('/api/notifications/unread-count'),
  markRead: (id: number) => api.patch(`/api/notifications/${id}`, { is_read: true }),
  markAllRead: () => api.post('/api/notifications/mark-all-read'),
};

// Dashboard
export const dashboardAPI = {
  stats: (year?: number) => api.get('/api/dashboard/stats', { params: { year } }),
};

// Exports
export const exportsAPI = {
  excel: (params?: { event_type?: string; date_from?: string; date_to?: string; month?: number; year?: number }) =>
    api.get('/api/exports/excel', { params, responseType: 'blob' }),
  pdf: (params?: { event_type?: string; date_from?: string; date_to?: string; month?: number; year?: number }) =>
    api.get('/api/exports/pdf', { params, responseType: 'blob' }),
};
