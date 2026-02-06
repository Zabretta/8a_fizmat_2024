import { useState } from 'react'
import './../styles/AccessTerminal.css'

interface AccessTerminalProps {
  onAccess: (nickname: string, code: string) => void
}

const AccessTerminal: React.FC<AccessTerminalProps> = ({ onAccess }) => {
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nickname && code) {
      onAccess(nickname, code)
    }
  }

  return (
    <div className="access-terminal">
      <div className="terminal-header">
        <h1>ТЕРМИНАЛ ДОСТУПА</h1>
        <p>Введите позывной и код для доступа к штабу</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>🚀 Позывной агента</label>
          <input
            type="text"
            className="terminal-input"
            placeholder="Введите ваш позывной"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>🔑 Код доступа</label>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              className="terminal-input"
              placeholder="Введите код отряда"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button type="submit" className="access-button">
          ВОЙТИ В ШТАБ
        </button>

        <div className="hint">
          💡 <strong>Подсказка:</strong> Код доступа одинаков для всех агентов отряда
        </div>
      </form>
    </div>
  )
}

export default AccessTerminal