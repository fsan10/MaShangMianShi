import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import Home from '@/pages/Home'
import Dashboard from '@/pages/Dashboard'
import QuestionDetail from '@/pages/QuestionDetail'
import Study from '@/pages/Study'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/question/:id" element={<QuestionDetail />} />
          <Route path="/study" element={<Study />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
