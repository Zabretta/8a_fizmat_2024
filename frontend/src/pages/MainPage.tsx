import { useEffect, useState } from 'react'
import Chat from '../components/Chat'
import Profile from '../components/Profile'
import '../styles/MainPage.css'

const MainPage = () => {
  console.log('MainPage рендерится')
  return (
    <div className="main-page-container">
      {/* Заголовок с эффектами */}
      <div className="main-header">
        <div className="header-scanline"></div>
        <div className="title-container">
          <h1 className="main-title">
            <span className="title-glow">8A</span>
            <span className="title-divider">│</span>
            <span className="title-text">ФИЗ-МАТ ШТАБ</span>
          </h1>
          <div className="subtitle">СИСТЕМА АКТИВНА • УРОВЕНЬ ДОСТУПА: <span className="access-level">ГАММА</span></div>
        </div>
        <div className="header-dots">
          <span className="dot active"></span>
          <span className="dot active"></span>
          <span className="dot active"></span>
        </div>
      </div>
      
      <div className="content-wrapper">
        <div className="chat-section">
          <Chat />
        </div>
        <div className="profile-section">
          <Profile />
        </div>
      </div>
      
      <div className="main-footer">
        <div className="footer-scanline"></div>
        <div className="footer-text">
          <span className="footer-icon">🛡️</span> ШТАБНАЯ СИСТЕМА • ВЕРСИЯ 1.0 • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}

export default MainPage