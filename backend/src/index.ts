import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'
import avatarRoutes from './routes/avatar'  // ← НОВЫЙ ИМПОРТ
import { setupSocket } from './utils/socket'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } })
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/avatars', avatarRoutes)  // ← НОВЫЙ РОУТ

setupSocket(io, prisma)

const PORT = process.env.PORT || 8000
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`)
})
