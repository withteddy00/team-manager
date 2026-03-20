import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
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
  register: (name: string, email: string, password: string, role: string = 'operateur', superviseurId?: string, teamId?: string) =>
    api.post('/api/auth/register', { name, email, password, role, superviseurId, teamId }),
  me: () => api.get('/api/auth/me'),
};

// Team Management (new - superviseur manages team)
export const teamManagementAPI = {
  createTeam: (name: string) => api.post('/api/team-management/', { name }),
  getMyTeam: () => api.get('/api/team-management/my-team'),
  getTeamById: (id: string) => api.get(`/api/team-management/${id}`),
  addOperator: (operatorId: string) => api.post('/api/team-management/add-operator', { operatorId }),
  removeOperator: (operatorId: string) => api.delete(`/api/team-management/remove-operator/${operatorId}`),
  getAllTeams: () => api.get('/api/team-management/all'),
  getAvailableOperators: () => api.get('/api/team-management/available-operators'),
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

// Team (old - for backward compatibility)
export const teamAPI = {
  list: (search?: string, status?: string) =>
    api.get('/api/team/', { params: { search, status } }),
  get: (id: number) => api.get(`/api/team/${id}`),
  create: (data: { full_name: string; position?: string; phone?: string; email?: string; status?: string }) =>
    api.post('/api/team/', data),
  update: (id: number, data: { full_name?: string; position?: string; phone?: string; email?: string; status?: string }) =>
    api.put(`/api/team/${id}`, data),
  delete: (id: number) => api.delete(`/api/team/${id}`),
  toggleStatus: (id: number) => api.patch(`/api/team/${id}/toggle-status`),
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
