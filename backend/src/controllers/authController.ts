import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || ''
const SQUAD_CODE = process.env.SQUAD_CODE || '8a_fizmat_2024' // ← Код отряда

export const login = async (req: Request, res: Response) => {
  try {
    const { nickname, code } = req.body
    
    // Проверяем код отряда
    if (code !== SQUAD_CODE) {
      return res.status(401).json({ error: 'Неверный код отряда' })
    }
    
    // Ищем пользователя
    let user = await prisma.user.findUnique({ where: { nickname } })
    
    // Если пользователя нет - создаём
    if (!user) {
      user = await prisma.user.create({
        data: { 
          nickname, 
          code: await bcrypt.hash(code, 10) // Сохраняем хеш для совместимости
        }
      })
    }
    
    // Проверяем код (если пользователь уже существовал)
    const valid = await bcrypt.compare(code, user.code)
    if (!valid) {
      return res.status(401).json({ error: 'Ошибка доступа' })
    }
    
    // Создаём токен
    const token = jwt.sign({ userId: user.id }, JWT_SECRET)
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        nickname: user.nickname,
        createdAt: user.createdAt
      } 
    })
  } catch (error) {
    console.error('Ошибка входа:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
}

// Удаляем регистрацию - она не нужна
export const register = async (req: Request, res: Response) => {
  res.status(400).json({ error: 'Используйте вход с кодом отряда' })
}

export const profile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId },
      select: { 
        id: true, 
        nickname: true, 
        createdAt: true,
        online: true
      }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки профиля' })
  }
}