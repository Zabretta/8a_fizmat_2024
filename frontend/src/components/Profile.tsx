import { useEffect, useState } from 'react'
import axios from 'axios'
import AvatarSelector from './AvatarSelector'
import './../styles/Profile.css'

interface User {
  id: string
  nickname: string
  avatar: string
  createdAt: string
  online: boolean
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

// 👇 Добавляем перехватчик для токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const Profile = () => {
  console.log('Компонент Profile рендерится')
  const [user, setUser] = useState<User | null>(null)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('Profile useEffect запущен')
      const token = localStorage.getItem('token')
      console.log('Токен из localStorage:', token)
      
      if (!token) {
        console.log('Токен не найден, прерываем')
        setLoading(false)
        return
      }

      try {
        console.log('Делаем запрос к /api/auth/profile')
        const response = await api.get('/api/auth/profile')
        console.log('Профиль успешно загружен:', response.data)
        setUser(response.data)
        // Сохраняем актуальный никнейм в localStorage
        if (response.data?.nickname) {
          localStorage.setItem('nickname', response.data.nickname)
        }
        if (response.data?.avatar) {
          localStorage.setItem('avatar', response.data.avatar)
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error)
        // Берем данные из localStorage, если они есть
        const savedNickname = localStorage.getItem('nickname')
        const savedAvatar = localStorage.getItem('avatar') || '🕵️'
        
        const mockUser = {
          id: 'temp-id-' + Math.random().toString(36).substr(2, 9),
          nickname: savedNickname || 'Тестовый агент',
          avatar: savedAvatar,
          createdAt: new Date().toISOString(),
          online: true
        }
        console.log('Установлены данные из localStorage:', mockUser)
        setUser(mockUser)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const changeAvatar = async (newAvatar: string) => {
    try {
      console.log('Смена аватара на:', newAvatar)
      
      const response = await api.patch('/api/auth/avatar', { avatar: newAvatar })
      console.log('Аватар успешно изменён:', response.data)
      
      // Сохраняем новый аватар в localStorage
      localStorage.setItem('avatar', newAvatar)
      
      setUser(prev => prev ? { ...prev, avatar: response.data.avatar } : null)
      setShowAvatarSelector(false)
      
      // СОБЫТИЕ ДЛЯ ОБНОВЛЕНИЯ ЧАТА
      window.dispatchEvent(new Event('avatarChanged'))
      
    } catch (error: any) {
      console.error('Ошибка смены аватара:', error.response?.data?.error || error.message)
      alert(error.response?.data?.error || 'Ошибка смены аватара')
    }
  }

  if (loading) return <div className="loading">Загрузка профиля...</div>
  if (!user) return <div className="loading">Профиль не найден</div>

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar" onClick={() => setShowAvatarSelector(true)}>
          {user.avatar}
          <div className="avatar-change-hint">СМЕНИТЬ</div>
        </div>
        <div className="profile-info">
          <h3>{user.nickname}</h3>
          <div className="agent-status">
            {user.online ? 'ОНЛАЙН' : 'ОФФЛАЙН'}
          </div>
        </div>
      </div>

      <div className="profile-details">
        <div className="detail-row">
          <span className="detail-label">ID агента:</span>
          <span className="detail-value">{user.id.substring(0, 8)}...</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">В штабе с:</span>
          <span className="detail-value">
            {new Date(user.createdAt).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Статус:</span>
          <span className="detail-value status-active">АКТИВЕН</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">1</div>
          <div className="stat-label">УРОВЕНЬ</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">0</div>
          <div className="stat-label">МИССИЙ</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">100</div>
          <div className="stat-label">КРЕДИТОВ</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">1</div>
          <div className="stat-label">НАГРАД</div>
        </div>
      </div>

      <div className="profile-actions">
        <button 
          className="profile-button"
          onClick={() => setShowAvatarSelector(true)}
        >
          СМЕНИТЬ АВАТАР
        </button>
        <button 
          className="logout-button"
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('nickname')
            localStorage.removeItem('avatar')
            window.location.href = '/login'
          }}
        >
          ВЫЙТИ ИЗ ШТАБА
        </button>
      </div>

      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={user.avatar}
          onAvatarSelect={changeAvatar}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  )
}

export default Profile