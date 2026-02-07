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

const Profile = () => {
  console.log('Компонент Profile рендерится')
  const [user, setUser] = useState<User | null>(null)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)

  useEffect(() => {
    console.log('Profile useEffect запущен')
    const token = localStorage.getItem('token')
    console.log('Токен из localStorage:', token)
    
    if (!token) {
      console.log('Токен не найден, прерываем')
      return
    }

    console.log('Делаем запрос к /api/auth/profile')
    axios.get('http://192.168.1.83:8000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log('Профиль успешно загружен:', res.data)
      setUser(res.data)
    })
    .catch(error => {
      console.error('Ошибка загрузки профиля:', error)
      console.log('Используем временные данные для тестирования')
      
      const mockUser = {
        id: 'temp-id-' + Math.random().toString(36).substr(2, 9),
        nickname: localStorage.getItem('nickname') || 'Тестовый агент',
        avatar: '🕵️',
        createdAt: new Date().toISOString(),
        online: true
      }
      console.log('Установлены временные данные:', mockUser)
      setUser(mockUser)
    })
  }, [])

  const changeAvatar = async (newAvatar: string) => {
    try {
      console.log('Смена аватара на:', newAvatar)
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await axios.patch(
        'http://192.168.1.83:8000/api/auth/avatar',
        { avatar: newAvatar },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      console.log('Аватар успешно изменён:', response.data)
      setUser(prev => prev ? { ...prev, avatar: response.data.avatar } : null)
      setShowAvatarSelector(false)
      
      // СОБЫТИЕ ДЛЯ ОБНОВЛЕНИЯ ЧАТА
      window.dispatchEvent(new Event('avatarChanged'))
      
    } catch (error: any) {
      console.error('Ошибка смены аватара:', error.response?.data?.error || error.message)
      alert(error.response?.data?.error || 'Ошибка смены аватара')
    }
  }

  if (!user) return <div className="loading">Загрузка профиля...</div>

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