import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'
import './index.css'

function App() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuth(!!token)
  }, [])

  // Пока проверяем авторизацию, показываем загрузку
  if (isAuth === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#00ff41',
        fontFamily: "'Courier New', monospace",
        fontSize: '1.2em',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #001500 100%)'
      }}>
        Проверка авторизации...
        <span style={{
          animation: 'loadingDots 1.5s infinite',
          display: 'inline-block',
          width: '20px',
          textAlign: 'left'
        }}></span>
        <style>{`
          @keyframes loadingDots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
          }
        `}</style>
      </div>
    )
  }

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