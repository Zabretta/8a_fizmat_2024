
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

export const setupSocket = (io: Server, prisma: PrismaClient) => {
  io.on('connection', (socket) => {
    console.log('👤 Пользователь подключился:', socket.id)

    socket.on('join', async (userId: string) => {
      await prisma.user.update({
        where: { id: userId },
        data: { online: true }
      })
      io.emit('user:online', userId)
    })

    socket.on('message:send', async (data: { userId: string; content: string }) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            userId: data.userId
          },
          include: { user: { select: { nickname: true } } }
        })
        io.emit('message:new', message)
      } catch (error) {
        console.error('Ошибка сохранения сообщения:', error)
      }
    })

    socket.on('disconnect', async () => {
      console.log('👤 Пользователь отключился:', socket.id)
    })
  })
}
