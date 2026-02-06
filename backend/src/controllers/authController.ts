import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getRandomFreeAvatar, AVAILABLE_AVATARS } from '../utils/avatars'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || '8a_fizmat_secret_key_2024'
const SQUAD_CODE = process.env.SQUAD_CODE

export const login = async (req: Request, res: Response) => {
  try {
    const { nickname, code } = req.body
    
    if (code !== SQUAD_CODE) {
      return res.status(401).json({ error: 'Неверный код отряда' })
    }
    
    let user = await prisma.user.findUnique({ where: { nickname } })
    
    if (!user) {
      try {
        const randomAvatar = await getRandomFreeAvatar(prisma)
        
        const userData = {
          nickname,
          code: await bcrypt.hash(code, 10),
          avatar: randomAvatar,
          online: true
        }
        
        user = await prisma.user.create({
          data: userData
        })
      } catch (avatarError: any) {
        return res.status(400).json({ error: avatarError.message })
      }
    } else {
      const valid = await bcrypt.compare(code, user.code)
      if (!valid) {
        return res.status(401).json({ error: 'Неверный код' })
      }
      
      user = await prisma.user.update({
        where: { id: user.id },
        data: { online: true }
      })
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET)
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.createdAt,
        online: user.online
      } 
    })
  } catch (error) {
    console.error('Ошибка входа:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
}

export const profile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { 
        id: true, 
        nickname: true, 
        avatar: true,
        createdAt: true,
        online: true
      }
    })
    res.json(user)
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
    res.status(500).json({ error: 'Ошибка загрузки профиля' })
  }
}

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const { avatar } = req.body
    const userId = req.userId
    
    if (!AVAILABLE_AVATARS.includes(avatar)) {
      return res.status(400).json({ error: 'Недоступный аватар' })
    }
    
    const existingUser = await prisma.user.findFirst({
      where: { 
        avatar: avatar
      }
    })
    
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: 'Аватар уже занят' })
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: { 
        id: true, 
        nickname: true, 
        avatar: true,
        createdAt: true 
      }
    })
    
    res.json(user)
  } catch (error) {
    console.error('Ошибка смены аватара:', error)
    res.status(500).json({ error: 'Ошибка смены аватара' })
  }
}

export const register = async (req: Request, res: Response) => {
  res.status(400).json({ error: 'Используйте вход с кодом отряда' })
}