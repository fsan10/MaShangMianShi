import api from './client'

export const adminApi = {
  login: (data: { username: string; password: string }) => api.post('/admin/login', data),
  listQuestions: (params?: Record<string, unknown>) => api.get('/admin/questions', { params }),
  createQuestion: (data: unknown) => api.post('/admin/questions', data),
  updateQuestion: (id: number, data: unknown) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id: number) => api.delete(`/admin/questions/${id}`),
  getQuestion: (id: number) => api.get(`/questions/${id}`),
  aiParse: (formData: FormData) => api.post('/admin/ai/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  aiImport: (data: unknown) => api.post('/admin/ai/import', data),
}
