// backend/src/index.ts

import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'
import avatarRoutes from './routes/avatar'
import adminRoutes from './routes/admin' // +++ ИМПОРТ АДМИН-РОУТА +++
import { setupSocket } from './utils/socket'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const server = http.createServer(app)

// Разрешаем все локальные адреса
const corsOptions = {
  origin: ['http://localhost:5173', 'http://192.168.1.83:5173', 'http://127.0.0.1:5173'],
  credentials: true
}

app.use(cors(corsOptions))

// Также для Socket.IO
const io = new Server(server, { 
  cors: {
    origin: ['http://localhost:5173', 'http://192.168.1.83:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  }
})

const prisma = new PrismaClient()

app.use(express.json())

// === ПУБЛИЧНЫЕ РОУТЫ ===
app.use('/api/auth', authRoutes)

// === ЗАЩИЩЕННЫЕ РОУТЫ (требуют авторизации) ===
// Роуты чата и аватаров используют middleware auth внутри себя
app.use('/api/chat', chatRoutes)
app.use('/api/avatars', avatarRoutes)

// === АДМИН-РОУТЫ (требуют авторизации + прав администратора) ===
// ВАЖНО: Размещаем после публичных роутов, но до обработки ошибок
app.use('/api/admin', adminRoutes)

// === WebSocket ===
setupSocket(io, prisma)

const PORT = process.env.PORT || 8000
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`)
  console.log(`📡 Доступен по адресам:`)
  console.log(`   - http://localhost:${PORT}`)
  console.log(`   - http://192.168.1.83:${PORT}`)
  console.log(`   - http://127.0.0.1:${PORT}`)
  
  // +++ АДМИН-ПОДТВЕРЖДЕНИЕ +++
  console.log(`🛡️  Командный центр активирован: /api/admin`)
  console.log(`   - Управление агентами: /api/admin/users`)
  console.log(`   - Модерация сообщений: /api/admin/messages`)
  console.log(`   - Настройки штаба: /api/admin/system`)
  console.log(`   - Журнал действий: /api/admin/logs`)
})
