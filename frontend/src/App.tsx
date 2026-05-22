import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider } from '@/contexts/AuthContext'
import AppLayout from '@/layouts/AppLayout'
import Dashboard from '@/pages/Dashboard'
import OJPage from '@/pages/OJ'
import ProgressPage from '@/pages/Progress'
import ReviewPage from '@/pages/Review'
import MistakesPage from '@/pages/Mistakes'
import QuestionManage from '@/pages/Questions'
import AIRecognize from '@/pages/AIRecognize'
import Projects from '@/pages/Projects'

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="questions" element={<QuestionManage />} />
              <Route path="ai" element={<AIRecognize />} />
              <Route path="projects" element={<Projects />} />
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
