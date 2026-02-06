import { useState, useEffect, useRef } from 'react'
import io, { Socket } from 'socket.io-client'
import axios from 'axios'
import './../styles/Chat.css'

interface MessageUser {
  nickname: string
  avatar: string  // ← ДОБАВЛЕНО
}

interface Message {
  id: string
  content: string
  userId: string
  user: MessageUser
  createdAt: string
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState('')
  const [userAvatar, setUserAvatar] = useState('👤')
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Получаем профиль
    axios.get('http://localhost:8000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setUserId(res.data.id)
      setUserAvatar(res.data.avatar || '👤')
    })

    // Загружаем сообщения
    axios.get('http://localhost:8000/api/chat/messages', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMessages(res.data))

    // Подключаем WebSocket
    const socket = io('http://localhost:8000')
    socketRef.current = socket

    socket.on('message:new', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const sendMessage = () => {
    if (input.trim() && userId && socketRef.current) {
      socketRef.current.emit('message:send', {
        userId,
        content: input
      })
      setInput('')
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