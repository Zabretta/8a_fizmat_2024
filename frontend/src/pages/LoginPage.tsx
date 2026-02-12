import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AccessTerminal from '../components/AccessTerminal'
import axios from 'axios'
import '../styles/LoginPage.css'

interface LoginPageProps {
  setIsAuth: (value: boolean) => void
}

// 👇 Умное определение базового URL
const API_URL = (() => {
  if (window.location.hostname === '192.168.1.83') {
    return 'http://192.168.1.83:8000'
  }
  return 'http://localhost:8000'
})()

// 👇 Создаем настроенный экземпляр axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const LoginPage: React.FC<LoginPageProps> = ({ setIsAuth }) => {
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleAccess = async (nickname: string, code: string) => {
    try {
      // 👇 Используем настроенный api, а не прямые URL
      const response = await api.post('/api/auth/login', {
        nickname,
        code
      })
      
      // ✅ Сохраняем токен
      localStorage.setItem('token', response.data.token)
      
      // ✅ СОХРАНЯЕМ НИКНЕЙМ!
      localStorage.setItem('nickname', nickname)
      
      // ✅ Сохраняем аватар, если он пришел в ответе
      if (response.data.user?.avatar) {
        localStorage.setItem('avatar', response.data.user.avatar)
      }
      
      // 👇 Добавляем токен в будущие запросы axios
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
      
      setIsAuth(true)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка входа')
      console.error('Детали ошибки:', err.message)
    }
  }

  return (
    <div className="login-page">
      <div className="logo-container">
        <div className="logo">8A ФИЗ-МАТ</div>
        <div className="logo-subtitle">СЕКРЕТНЫЙ ШТАБ</div>
      </div>
      
      <div className="login-container">
        <div className="warning-banner">
          <h3>ДОСТУП ОГРАНИЧЕН</h3>
          <p>Доступ разрешен только агентам отряда 8A. Используйте кодовое слово, полученное от командира.</p>
        </div>
        
        <AccessTerminal onAccess={handleAccess} />
        
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
        
        <div className="agents-list">
          <h4>🔍 АКТИВНЫЕ АГЕНТЫ:</h4>
          <div className="agent-list-item">
            <span className="agent-name">Командир</span>
            <span className="agent-status">ОНЛАЙН</span>
          </div>
          <div className="agent-list-item">
            <span className="agent-name">Агент Хакер</span>
            <span className="agent-status">ОФФЛАЙН</span>
          </div>
          <div className="agent-list-item">
            <span className="agent-name">Шифровальщик</span>
            <span className="agent-status">В МИССИИ</span>
          </div>
          <div className="agent-list-item">
            <span className="agent-name">Разведчик</span>
            <span className="agent-status">ОНЛАЙН</span>
          </div>
        </div>
        
        <div className="footer-hint">
          Система автоматической регистрации. Первый вход создаст ваш аккаунт.
        </div>
      </div>
    </div>
  )
}

export default LoginPage