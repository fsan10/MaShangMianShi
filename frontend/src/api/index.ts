import api from './client'

export const authApi = {
  requestLoginCode: (sessionId: string) => api.post('/auth/login/code', null, { params: { session_id: sessionId } }),
  checkLoginStatus: (sessionId: string) => api.get('/auth/login/status', { params: { session_id: sessionId } }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
}

export const questionApi = {
  list: (params?: Record<string, unknown>) => api.get('/questions/', { params }),
  get: (id: number) => api.get(`/questions/${id}`),
  categories: () => api.get('/questions/categories/list'),
  difficulties: () => api.get('/questions/difficulties/list'),
}

export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
  techStackCategories: () => api.get('/stats/tech-stack-categories'),
}

export const studyApi = {
  getRecords: () => api.get('/study/records'),
  createRecord: (data: { question_id: number }) => api.post('/study/record', data),
  getReviewList: () => api.get('/study/review'),
  submitReview: (recordId: number, data: { correct: boolean }) => api.post(`/study/review/${recordId}`, data),
  getProgress: () => api.get('/study/progress'),
  getCheckins: (year?: number, month?: number) => api.get('/study/checkins', { params: { year, month } }),
}
