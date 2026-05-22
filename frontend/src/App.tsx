import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import OJPage from '@/pages/OJ'
import ProgressPage from '@/pages/Progress'
import ReviewPage from '@/pages/Review'
import MistakesPage from '@/pages/Mistakes'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 100, textAlign: 'center' }}>加载中...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="oj" element={<OJPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="review" element={<ReviewPage />} />
              <Route path="mistakes" element={<MistakesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
