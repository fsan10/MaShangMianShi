import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'
import Login from '@/pages/Login'
import Questions from '@/pages/Questions'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route path="/questions" element={<Questions />} />
          <Route path="/" element={<Navigate to="/questions" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
