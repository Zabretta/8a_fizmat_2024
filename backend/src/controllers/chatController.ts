
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nickname: true } } }
    })
    res.json(messages.reverse())
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки сообщений' })
  }
}
