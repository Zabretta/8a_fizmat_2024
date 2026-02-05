
import { useEffect, useState } from 'react'
import axios from 'axios'

interface User {
  id: string
  nickname: string
  createdAt: string
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    axios.get('http://localhost:8000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUser(res.data))
  }, [])

  if (!user) return <div>Загрузка...</div>

  return (
    <div style={{ border: '2px solid #0f0', padding: '20px', borderRadius: '5px' }}>
      <h3>ЛИЧНЫЙ КАБИНЕТ</h3>
      <p><strong>Позывной:</strong> {user.nickname}</p>
      <p><strong>ID:</strong> {user.id.substring(0, 8)}...</p>
      <p><strong>В штабе с:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
      <button
        onClick={() => {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }}
        style={{ background: 'red', color: 'white', padding: '10px', border: 'none' }}
      >
        ВЫЙТИ
      </button>
    </div>
  )
}

export default Profile