import { useEffect, useState } from 'react'
import axios from 'axios'
import './../styles/AvatarSelector.css'

interface AvatarSelectorProps {
  currentAvatar: string
  onAvatarSelect: (avatar: string) => void
  onClose: () => void
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

const AVAILABLE_AVATARS = [
  '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️',
  '👷', '👷‍♂️', '👷‍♀️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳',
  '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🏫', '👨‍🏫', '👩‍🏫',
  '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️',
  '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️',
  '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️',
  '🧟', '🧟‍♂️', '🧟‍♀️', '🤴', '👸', '🚶', '🚶‍♂️', '🚶‍♀️', '🏃', '🏃‍♂️',
  '🏃‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🤸', '🤸‍♂️',
  '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️',
  '🤾‍♀️', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄', '🏄‍♂️',
  '🏄‍♀️', '🎭', '🤡', '👺', '👹', '👻', '💀', '☠️', '👽', '👾', '🤖',
  '🎃', '😈', '👿', '🥸', '🕶️', '🥽'
]

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ 
  currentAvatar, 
  onAvatarSelect, 
  onClose 
}) => {
  const [usedAvatars, setUsedAvatars] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsedAvatars = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }

        const response = await api.get('/api/avatars/used-avatars')
        setUsedAvatars(response.data.used || [])
      } catch (error) {
        console.error('Ошибка загрузки аватаров:', error)
        setUsedAvatars([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsedAvatars()
  }, [])

  if (loading) {
    return (
      <div className="avatar-selector-modal">
        <div className="modal-content">
          <div className="loading">Загрузка аватаров...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="avatar-selector-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>🏷️ ВЫБОР АВАТАРА</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="info-panel">
          <div className="info-item">
            <span className="free-avatar"></span>
            <span>Свободен</span>
          </div>
          <div className="info-item">
            <span className="used-avatar"></span>
            <span>Занят</span>
          </div>
          <div className="info-item">
            <span className="current-avatar"></span>
            <span>Ваш текущий</span>
          </div>
        </div>

        <div className="avatar-grid">
          {AVAILABLE_AVATARS.map(avatar => {
            const isUsed = usedAvatars.includes(avatar) && avatar !== currentAvatar
            const isCurrent = avatar === currentAvatar
            
            return (
              <button
                key={avatar}
                className={`avatar-item ${isCurrent ? 'current' : ''} ${isUsed ? 'used' : 'free'}`}
                onClick={() => {
                  if (!isUsed) {
                    onAvatarSelect(avatar)
                    onClose()
                  }
                }}
                disabled={isUsed}
                title={isUsed ? 'Аватар занят другим агентом' : isCurrent ? 'Ваш текущий аватар' : 'Свободен для выбора'}
              >
                <span className="avatar-emoji">{avatar}</span>
                {isCurrent && <div className="avatar-badge">ВЫ</div>}
                {isUsed && <div className="avatar-badge">ЗАНЯТ</div>}
              </button>
            )
          })}
        </div>

        <div className="modal-footer">
          <p className="hint">
            💡 Аватар уникален для каждого агента. Выбирайте с умом!
          </p>
          <button className="cancel-button" onClick={onClose}>
            ОТМЕНИТЬ ВЫБОР
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarSelector