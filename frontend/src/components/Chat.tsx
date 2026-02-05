
import { useState, useEffect, useRef } from 'react'
import io, { Socket } from 'socket.io-client'
import axios from 'axios'

interface Message {
  id: string
  content: string
  userId: string
  user: { nickname: string }
  createdAt: string
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState('')
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Получаем профиль
    axios.get('http://localhost:8000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUserId(res.data.id))

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
    <div className="chat-window">
      <div style={{ height: '350px', overflowY: 'auto' }}>
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <strong>{msg.user.nickname}: </strong>
            {msg.content}
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Введите сообщение..."
          style={{ width: '80%', padding: '10px' }}
        />
        <button onClick={sendMessage} style={{ padding: '10px' }}>
          Отправить
        </button>
      </div>
    </div>
  )
}

export default Chat