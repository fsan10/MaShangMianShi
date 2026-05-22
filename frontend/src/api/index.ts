import api from './client'

export const authApi = {
  getQRCode: () => api.post('/auth/login/qrcode'),
  checkStatus: (sessionId: string) => api.get(`/auth/login/status?session_id=${sessionId}`),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
}

export const questionApi = {
  list: (params?: Record<string, unknown>) => api.get('/questions/', { params }),
  get: (id: number) => api.get(`/questions/${id}`),
  create: (data: unknown) => api.post('/questions/', data),
  update: (id: number, data: unknown) => api.put(`/questions/${id}`, data),
  delete: (id: number) => api.delete(`/questions/${id}`),
}

export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
  knowledgeRanking: (params?: Record<string, unknown>) => api.get('/stats/knowledge-points', { params }),
  techStack: () => api.get('/stats/tech-stack'),
  difficultyLevels: () => api.get('/stats/difficulty-levels'),
  companyDistribution: () => api.get('/stats/company-distribution'),
}

export const ojApi = {
  listProblems: (params?: Record<string, unknown>) => api.get('/oj/problems', { params }),
  getProblem: (id: number) => api.get(`/oj/problems/${id}`),
  createProblem: (data: unknown) => api.post('/oj/problems', data),
  submit: (problemId: number, sqlCode: string) =>
    api.post(`/oj/problems/${problemId}/submit`, { sql_code: sqlCode }),
  getSubmissions: (problemId: number) => api.get(`/oj/problems/${problemId}/submissions`),
  getSubmission: (id: number) => api.get(`/oj/submissions/${id}`),
}

export const progressApi = {
  overview: () => api.get('/progress/overview'),
  checkins: (year?: number) => api.get('/progress/checkins', { params: { year } }),
  chapters: () => api.get('/progress/chapters'),
  radar: () => api.get('/progress/radar'),
}

export const reviewApi = {
  knowledgePoints: (categoryId?: number) =>
    api.get('/review/knowledge-points', { params: { category_id: categoryId } }),
  start: (knowledgePointId: number) => api.post('/review/start', null, { params: { knowledge_point_id: knowledgePointId } }),
  weakPoints: () => api.get('/review/weak-points'),
  complete: (planId: number) => api.post('/review/complete', null, { params: { plan_id: planId } }),
}

export const mistakesApi = {
  active: (params?: Record<string, unknown>) => api.get('/mistakes/active', { params }),
  mastered: (params?: Record<string, unknown>) => api.get('/mistakes/mastered', { params }),
  review: (id: number) => api.post(`/mistakes/${id}/review`),
  remove: (id: number) => api.post(`/mistakes/${id}/remove`),
  toggleFavorite: (id: number) => api.post(`/mistakes/${id}/favorite`),
  rejoin: (id: number) => api.post(`/mistakes/${id}/rejoin`),
}

export const syncApi = {
  upload: (data: Record<string, unknown>) => api.post('/sync/upload', { data }),
  download: () => api.get('/sync/download'),
}
