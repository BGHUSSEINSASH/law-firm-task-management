import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Tasks API
export const tasksAPI = {
  create: (data) => api.post('/tasks', data),
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  approveByAdmin: (id) => api.put(`/tasks/${id}/approve/admin`),
  approveByMainLawyer: (id) => api.put(`/tasks/${id}/approve/main-lawyer`),
  approveByAssignedLawyer: (id) => api.put(`/tasks/${id}/approve/assigned-lawyer`),
};

// Departments API
export const departmentsAPI = {
  create: (data) => api.post('/departments', data),
  getAll: () => api.get('/departments'),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Lawyers API
export const lawyersAPI = {
  create: (data) => api.post('/lawyers', data),
  getAll: () => api.get('/lawyers'),
  getById: (id) => api.get(`/lawyers/${id}`),
  update: (id, data) => api.put(`/lawyers/${id}`, data),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getByRole: (role) => api.get(`/users/role/${role}`),
};

// Statistics API
export const statisticsAPI = {
  getDashboard: () => api.get('/statistics/dashboard'),
  getTasksByDepartment: () => api.get('/statistics/tasks-by-department'),
  getTasksByLawyer: () => api.get('/statistics/tasks-by-lawyer'),
};

// Clients API
export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Stages API (المراحل)
export const stagesAPI = {
  getAll: () => api.get('/stages'),
  getById: (id) => api.get(`/stages/${id}`),
  create: (data) => api.post('/stages', data),
  update: (id, data) => api.put(`/stages/${id}`, data),
  delete: (id) => api.delete(`/stages/${id}`),
  updateTaskStage: (taskId, stageId) => api.put(`/stages/task/${taskId}/stage/${stageId}`),
  getTasksByStage: (stageId) => api.get(`/stages/${stageId}/tasks`),
  approveTask: (stageId, taskId) => api.post(`/stages/${stageId}/tasks/${taskId}/approve`),
};

// Notifications API (الإشعارات)
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAllRead: () => api.delete('/notifications/read/all'),
  create: (data) => api.post('/notifications/create', data),
};


export default api;
