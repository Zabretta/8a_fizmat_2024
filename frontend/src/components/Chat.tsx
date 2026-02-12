import { useState, useEffect, useRef } from 'react'
import io, { Socket } from 'socket.io-client'
import axios from 'axios'
import './../styles/Chat.css'

interface MessageUser {
  nickname: string
  avatar: string
}

interface Message {
  id: string
  content: string
  userId: string
  user: MessageUser
  createdAt: string
}

// 👇 УМНОЕ ОПРЕДЕЛЕНИЕ URL (как в Profile и AvatarSelector)
const API_URL = (() => {
  if (window.location.hostname === '192.168.1.83') {
    return 'http://192.168.1.83:8000'
  }
  return 'http://localhost:8000'
})()

// 👇 СОЗДАЁМ НАСТРОЕННЫЙ ЭКЗЕМПЛЯР AXIOS
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 👇 ПЕРЕХВАТЧИК ТОКЕНА
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState('')
  const [userAvatar, setUserAvatar] = useState('👤')
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Загружаем профиль
    api.get('/api/auth/profile')
      .then(res => {
        setUserId(res.data.id)
        setUserAvatar(res.data.avatar || '👤')
      })
      .catch(err => console.error('Ошибка загрузки профиля:', err))

    // Загружаем историю сообщений
    api.get('/api/chat/messages')
      .then(res => setMessages(res.data))
      .catch(err => console.error('Ошибка загрузки сообщений:', err))

    // 👇 ПОДКЛЮЧАЕМСЯ К SOCKET.IO С ПРАВИЛЬНЫМ URL
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'], // пробуем WebSocket, потом polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ Socket.IO подключён!', socket.id)
      // Отправляем событие join после подключения
      if (userId) {
        socket.emit('join', userId)
      }
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Ошибка подключения Socket.IO:', error.message)
    })

    socket.on('message:new', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      socket.disconnect()
    }
  }, []) // Зависимости пустые — выполнится один раз при монтировании

  // Отдельный эффект для отправки join после получения userId
  useEffect(() => {
    if (userId && socketRef.current?.connected) {
      socketRef.current.emit('join', userId)
    }
  }, [userId])

  // Эффект для обновления аватара
  useEffect(() => {
    const handleAvatarChange = () => {
      const token = localStorage.getItem('token')
      if (!token) return
      
      api.get('/api/auth/profile')
        .then(res => {
          setUserAvatar(res.data.avatar || '👤')
        })
        .catch(err => console.error('Ошибка обновления аватара:', err))
    }
    
    window.addEventListener('avatarChanged', handleAvatarChange)
    
    return () => {
      window.removeEventListener('avatarChanged', handleAvatarChange)
    }
  }, [])

  const sendMessage = () => {
    if (input.trim() && userId && socketRef.current?.connected) {
      socketRef.current.emit('message:send', {
        userId,
        content: input
      })
      setInput('')
    } else {
      console.warn('Не удалось отправить сообщение: нет соединения или userId')
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>📡 ОБЩИЙ КАНАЛ СВЯЗИ</h2>
        <div className="online-indicator">
          <span className="online-dot"></span>
          <span>Онлайн: {messages.length > 0 ? 'Активность' : 'Тишина'}</span>
        </div>
      </div>

      <div className="messages-container">
        {messages.map(msg => {
          const isOwnMessage = msg.userId === userId
          
          return (
            <div 
              key={msg.id} 
              className={`message ${isOwnMessage ? 'message-self' : 'message-other'}`}
            >
              <div className="message-header">
                <span className="message-avatar">{msg.user.avatar}</span>
                <span className="message-sender">{msg.user.nickname}</span>
                <span className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          )
        })}
      </div>

      <div className="message-input-area">
        <div className="avatar-preview">{userAvatar}</div>
        <input
          type="text"
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Введите сообщение для передачи..."
        />
        <button 
          className="send-button"
          onClick={sendMessage}
          disabled={!input.trim()}
        >
          📨
        </button>
      </div>
    </div>
  )
}

export default Chat