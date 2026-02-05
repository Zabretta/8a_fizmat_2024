import { useState } from 'react'

interface AccessTerminalProps {
  onAccess: (nickname: string, code: string) => void
}

const AccessTerminal: React.FC<AccessTerminalProps> = ({ onAccess }) => {
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nickname && code) {
      onAccess(nickname, code)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ color: '#0f0', fontSize: '2em' }}>ТЕРМИНАЛ ДОСТУПА</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Позывной"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ padding: '10px', margin: '10px', width: '300px' }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Код доступа"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ padding: '10px', margin: '10px', width: '300px' }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            background: '#0f0',
            color: '#000',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ВОЙТИ В ШТАБ
        </button>
      </form>
    </div>
  )
}

export default AccessTerminal
