
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || ''

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Доступ запрещен' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    (req as any).userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Неверный токен' })
  }
}
