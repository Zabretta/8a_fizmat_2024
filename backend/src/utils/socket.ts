import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

export const setupSocket = (io: Server, prisma: PrismaClient) => {
  io.on('connection', (socket) => {
    console.log('👤 Пользователь подключился:', socket.id)

    socket.on('join', async (userId: string) => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { online: true }
        })
        io.emit('user:online', userId)
        console.log(`✅ Пользователь ${userId} онлайн`)
      } catch (error) {
        console.error('Ошибка обновления статуса:', error)
      }
    })

    socket.on('message:send', async (data: { userId: string; content: string }) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            userId: data.userId
          },
          include: { 
            user: { 
              select: { 
                nickname: true, 
                avatar: true
              } 
            } 
          }
        })
        io.emit('message:new', message)
        console.log(`📨 Сообщение от ${data.userId}: ${data.content.substring(0, 20)}...`)
      } catch (error) {
        console.error('❌ Ошибка сохранения сообщения:', error)
      }
    })

    socket.on('disconnect', async () => {
      console.log('👤 Пользователь отключился:', socket.id)
    })
  })
}