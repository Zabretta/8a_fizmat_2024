// backend/src/middleware/adminAuth.ts

import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Middleware для проверки прав администратора
 * Используется после middleware auth, требует наличия req.userId
 */
export const adminAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // 1. Проверяем, авторизован ли пользователь (должен быть установлен auth middleware до этого)
  const userId = req.userId
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Требуется авторизация',
      code: 'UNAUTHORIZED' 
    })
  }

  try {
    // 2. Ищем пользователя в БД и получаем его роль
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true,
        nickname: true // Для логирования
      }
    })

    if (!user) {
      return res.status(401).json({ 
        error: 'Пользователь не найден',
        code: 'USER_NOT_FOUND' 
      })
    }

    // 3. Проверка на роль администратора
    if (user.role !== 'admin') {
      // Логируем попытку несанкционированного доступа
      console.warn(`[ADMIN-AUTH] Попытка доступа к админ-роуту пользователем ${user.nickname} (${userId}) с ролью ${user.role}`)
      
      return res.status(403).json({ 
        error: 'Доступ запрещен. Требуются права командного состава.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      })
    }

    // 4. Добавляем информацию о пользователе в req для дальнейшего использования
    req.user = {
      id: userId,
      nickname: user.nickname,
      role: user.role
    }

    // 5. Пропускаем запрос дальше
    next()
  } catch (error) {
    console.error('[ADMIN-AUTH] Ошибка проверки прав:', error)
    res.status(500).json({ 
      error: 'Ошибка проверки прав доступа',
      code: 'INTERNAL_SERVER_ERROR'
    })
  }
}

/**
 * Middleware для логирования действий администратора
 * Используется в админ-роутах после adminAuth
 */
export const logAdminAction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Сохраняем оригинальный метод json, чтобы перехватить ответ
  const originalJson = res.json
  const userId = req.userId
  const action = `${req.method} ${req.baseUrl + req.path}`

  // Переопределяем res.json для логирования после отправки ответа
  res.json = function(body) {
    // Восстанавливаем оригинальный метод
    res.json = originalJson
    
    // Логируем действие асинхронно, не блокируя ответ
    if (userId && body && res.statusCode >= 200 && res.statusCode < 300) {
      prisma.adminLog.create({
        data: {
          action,
          targetId: req.params.id || req.body.targetId,
          details: JSON.stringify({
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body,
            response: body
          }),
          adminId: userId
        }
      }).catch(err => console.error('[ADMIN-LOG] Ошибка логирования:', err))
    }
    
    return originalJson.call(this, body)
  }

  next()
}

/**
 * Middleware для проверки супер-админа (опционально)
 * Если понадобится иерархия прав
 */
export const superAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId
  
  if (!userId) {
    return res.status(401).json({ error: 'Требуется авторизация' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    // Здесь можно добавить специальную роль "superadmin" или проверять по списку
    if (user?.role !== 'superadmin' && userId !== 'SPECIFIC_ADMIN_UUID') {
      return res.status(403).json({ 
        error: 'Требуются права командующего',
        code: 'FORBIDDEN_SUPER_ADMIN'
      })
    }

    next()
  } catch (error) {
    res.status(500).json({ error: 'Ошибка проверки прав' })
  }
}

// Расширяем типы Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        nickname: string
        role: string
      }
    }
  }
}
