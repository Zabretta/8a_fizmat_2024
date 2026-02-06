import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AVAILABLE_AVATARS } from '../utils/avatars'

const prisma = new PrismaClient()

// Получить список занятых аватаров
export const getUsedAvatars = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { avatar: true } 
    })
    
    const usedAvatars = users.map((user: { avatar: string }) => user.avatar)
    
    res.json({
      available: AVAILABLE_AVATARS.length,
      used: usedAvatars,
      free: AVAILABLE_AVATARS.filter(a => !usedAvatars.includes(a))
    })
  } catch (error) {
    console.error('Ошибка получения аватаров:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
}

// Получить все доступные аватары
export const getAllAvatars = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { avatar: true, nickname: true } 
    })
    
    const usedAvatars = users.reduce((acc: Record<string, string>, user: { avatar: string, nickname: string }) => {
      acc[user.avatar] = user.nickname
      return acc
    }, {})
    
    const avatarsWithStatus = AVAILABLE_AVATARS.map(avatar => ({
      avatar,
      isUsed: !!usedAvatars[avatar],
      usedBy: usedAvatars[avatar] || null
    }))
    
    res.json({
      total: AVAILABLE_AVATARS.length,
      avatars: avatarsWithStatus
    })
  } catch (error) {
    console.error('Ошибка получения всех аватаров:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
}