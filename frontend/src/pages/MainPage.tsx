
import { useEffect, useState } from 'react'
import Chat from '../components/Chat'
import Profile from '../components/Profile'

const MainPage = () => {
  return (
    <div>
      <h1 className="terminal-title">8A ФИЗ-МАТ ШТАБ</h1>
      <div style={{ display: 'flex', padding: '20px' }}>
        <div style={{ flex: 3 }}>
          <Chat />
        </div>
        <div style={{ flex: 1 }}>
          <Profile />
        </div>
      </div>
    </div>
  )
}

export default MainPage