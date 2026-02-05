import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'
import './index.css'

function App() {
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuth(!!token)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuth ? <MainPage /> : <Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage setIsAuth={setIsAuth} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
