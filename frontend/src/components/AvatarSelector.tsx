import { useEffect, useState } from 'react'
import axios from 'axios'
import './../styles/AvatarSelector.css'

interface AvatarSelectorProps {
  currentAvatar: string
  onAvatarSelect: (avatar: string) => void
  onClose: () => void
}

// Статичный список аватаров (101 шт)
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
        if (!token) return

        // Получаем список занятых аватаров с правильного эндпоинта
        const response = await axios.get('http://localhost:8000/api/avatars/used-avatars', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUsedAvatars(response.data.used || [])
      } catch (error) {
        console.error('Ошибка загрузки аватаров:', error)
        // Если эндпоинта нет, используем пустой список
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