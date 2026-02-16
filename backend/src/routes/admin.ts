// backend/src/routes/admin.ts

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { auth } from '../middleware/auth'
import { adminAuth, logAdminAction } from '../middleware/adminAuth'

const router = Router()
const prisma = new PrismaClient()

// === ЗАЩИТА ВСЕХ АДМИН-РОУТОВ ===
// Все роуты ниже требуют авторизации и прав администратора
router.use(auth, adminAuth)

// ==== 1. УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =====

/**
 * GET /api/admin/users
 * Получение списка всех пользователей с их статистикой
 */
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        avatar: true,
        online: true,
        role: true,
        createdAt: true,
        messages: {
          select: { id: true }
        },
        adminLogs: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Форматируем ответ
    const formattedUsers = users.map(user => ({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      online: user.online,
      role: user.role,
      createdAt: user.createdAt,
      messageCount: user.messages.length,
      actionCount: user.adminLogs.length
    }))

    res.json(formattedUsers)
  } catch (error) {
    console.error('[ADMIN] Ошибка получения пользователей:', error)
    res.status(500).json({ 
      error: 'Ошибка загрузки списка агентов',
      code: 'USERS_FETCH_ERROR'
    })
  }
})

/**
 * GET /api/admin/users/:id
 * Получение детальной информации о конкретном пользователе
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        online: true,
        role: true,
        createdAt: true,
        messages: {
          select: {
            id: true,
            content: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        adminLogs: {
          where: { adminId: id },
          select: {
            action: true,
            targetId: true,
            details: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        error: 'Агент не найден',
        code: 'USER_NOT_FOUND'
      })
    }

    // Проверяем, забанен ли пользователь
    const ban = await prisma.userBan.findUnique({
      where: { userId: id }
    })

    res.json({
      ...user,
      isBanned: !!ban,
      banDetails: ban ? {
        reason: ban.reason,
        bannedAt: ban.bannedAt,
        expiresAt: ban.expiresAt
      } : null,
      messageCount: user.messages.length
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка получения пользователя:', error)
    res.status(500).json({
      error: 'Ошибка загрузки данных агента',
      code: 'USER_FETCH_ERROR'
    })
  }
})

/**
 * PATCH /api/admin/users/:id/role
 * Изменение роли пользователя
 */
router.patch('/users/:id/role', logAdminAction, async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body
    const adminId = req.userId

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Некорректная роль. Допустимые значения: user, admin',
        code: 'INVALID_ROLE'
      })
    }

    // Получаем текущего пользователя для логирования
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { nickname: true, role: true }
    })

    if (!targetUser) {
      return res.status(404).json({
        error: 'Агент не найден',
        code: 'USER_NOT_FOUND'
      })
    }

    // Обновляем роль
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        nickname: true,
        role: true,
        avatar: true
      }
    })

    // Логируем изменение роли (дополнительно к автоматическому логу)
    await prisma.adminLog.create({
      data: {
        action: 'CHANGE_ROLE',
        targetId: id,
        details: JSON.stringify({
          oldRole: targetUser.role,
          newRole: role,
          changedBy: adminId
        }),
        adminId: adminId!
      }
    })

    res.json({
      message: `Роль агента ${updatedUser.nickname} изменена на ${role === 'admin' ? 'Командир' : 'Агент'}`,
      user: updatedUser
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка изменения роли:', error)
    res.status(500).json({
      error: 'Ошибка изменения роли агента',
      code: 'ROLE_UPDATE_ERROR'
    })
  }
})

/**
 * POST /api/admin/users/:id/ban
 * Блокировка пользователя
 */
router.post('/users/:id/ban', logAdminAction, async (req, res) => {
  try {
    const { id } = req.params
    const { reason, expiresIn } = req.body // expiresIn в часах, null = навсегда
    const adminId = req.userId

    // Нельзя забанить админа
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, nickname: true }
    })

    if (!targetUser) {
      return res.status(404).json({
        error: 'Агент не найден',
        code: 'USER_NOT_FOUND'
      })
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({
        error: 'Нельзя заблокировать командный состав',
        code: 'CANNOT_BAN_ADMIN'
      })
    }

    // Рассчитываем дату истечения блокировки
    let expiresAt = null
    if (expiresIn && !isNaN(parseInt(expiresIn))) {
      expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn))
    }

    // Создаем или обновляем блокировку
    const ban = await prisma.userBan.upsert({
      where: { userId: id },
      update: {
        reason: reason || 'Нарушение устава',
        bannedBy: adminId!,
        bannedAt: new Date(),
        expiresAt
      },
      create: {
        userId: id,
        reason: reason || 'Нарушение устава',
        bannedBy: adminId!,
        expiresAt
      }
    })

    res.json({
      message: `Агент ${targetUser.nickname} заблокирован${expiresAt ? ` до ${expiresAt.toLocaleString('ru-RU')}` : ' навсегда'}`,
      ban
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка блокировки:', error)
    res.status(500).json({
      error: 'Ошибка блокировки агента',
      code: 'BAN_ERROR'
    })
  }
})

/**
 * DELETE /api/admin/users/:id/ban
 * Разблокировка пользователя
 */
router.delete('/users/:id/ban', logAdminAction, async (req, res) => {
  try {
    const { id } = req.params

    const ban = await prisma.userBan.findUnique({
      where: { userId: id },
      include: { user: { select: { nickname: true } } }
    })

    if (!ban) {
      return res.status(404).json({
        error: 'Агент не заблокирован',
        code: 'NOT_BANNED'
      })
    }

    await prisma.userBan.delete({
      where: { userId: id }
    })

    res.json({
      message: `Агент ${ban.user.nickname} разблокирован`,
      code: 'UNBANNED'
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка разблокировки:', error)
    res.status(500).json({
      error: 'Ошибка разблокировки агента',
      code: 'UNBAN_ERROR'
    })
  }
})

// ==== 2. МОДЕРАЦИЯ СООБЩЕНИЙ =====

/**
 * GET /api/admin/messages
 * Получение всех сообщений с фильтрацией
 */
router.get('/messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0, userId } = req.query

    const where = userId ? { userId: String(userId) } : {}

    const messages = await prisma.message.findMany({
      where,
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    })

    const total = await prisma.message.count({ where })

    res.json({
      messages,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + Number(limit)
      }
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка получения сообщений:', error)
    res.status(500).json({
      error: 'Ошибка загрузки сообщений',
      code: 'MESSAGES_FETCH_ERROR'
    })
  }
})

/**
 * DELETE /api/admin/messages/:id
 * Удаление сообщения (модерация)
 */
router.delete('/messages/:id', logAdminAction, async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.userId

    // Получаем сообщение для логирования
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        user: {
          select: { nickname: true }
        }
      }
    })

    if (!message) {
      return res.status(404).json({
        error: 'Сообщение не найдено',
        code: 'MESSAGE_NOT_FOUND'
      })
    }

    // Удаляем сообщение
    await prisma.message.delete({
      where: { id }
    })

    // Логируем удаление
    await prisma.adminLog.create({
      data: {
        action: 'DELETE_MESSAGE',
        targetId: id,
        details: JSON.stringify({
          messageContent: message.content.substring(0, 100),
          author: message.user.nickname,
          deletedBy: adminId
        }),
        adminId: adminId!
      }
    })

    res.json({
      message: 'Сообщение удалено',
      deletedMessageId: id
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка удаления сообщения:', error)
    res.status(500).json({
      error: 'Ошибка удаления сообщения',
      code: 'MESSAGE_DELETE_ERROR'
    })
  }
})

// ==== 3. СИСТЕМНЫЕ НАСТРОЙКИ =====

/**
 * GET /api/admin/system
 * Получение текущих настроек системы
 */
router.get('/system', async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'squad-config' }
    })

    // Если настроек нет, создаем с значениями по умолчанию
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'squad-config',
          squadCode: '8A-FIZMAT',
          allowCustomAvatars: true,
          systemMessageActive: false,
          profanityFilter: false,
          requireModeration: false
        }
      })
    }

    // Получаем список забаненных слов
    const bannedWords = await prisma.bannedWord.findMany({
      select: { word: true, createdAt: true }
    })

    res.json({
      ...settings,
      bannedWords: bannedWords.map(bw => bw.word)
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка получения настроек:', error)
    res.status(500).json({
      error: 'Ошибка загрузки настроек штаба',
      code: 'SETTINGS_FETCH_ERROR'
    })
  }
})

/**
 * PATCH /api/admin/system
 * Обновление системных настроек
 */
router.patch('/system', logAdminAction, async (req, res) => {
  try {
    const {
      squadCode,
      allowCustomAvatars,
      systemMessage,
      systemMessageActive,
      profanityFilter,
      requireModeration
    } = req.body

    const adminId = req.userId

    // Получаем текущие настройки для сравнения
    const currentSettings = await prisma.systemSettings.findUnique({
      where: { id: 'squad-config' }
    })

    // Обновляем настройки
    const updatedSettings = await prisma.systemSettings.upsert({
      where: { id: 'squad-config' },
      update: {
        squadCode: squadCode ?? currentSettings?.squadCode,
        allowCustomAvatars: allowCustomAvatars ?? currentSettings?.allowCustomAvatars,
        systemMessage: systemMessage ?? currentSettings?.systemMessage,
        systemMessageActive: systemMessageActive ?? currentSettings?.systemMessageActive,
        profanityFilter: profanityFilter ?? currentSettings?.profanityFilter,
        requireModeration: requireModeration ?? currentSettings?.requireModeration,
        updatedBy: adminId
      },
      create: {
        id: 'squad-config',
        squadCode: squadCode || '8A-FIZMAT',
        allowCustomAvatars: allowCustomAvatars ?? true,
        systemMessage: systemMessage || null,
        systemMessageActive: systemMessageActive ?? false,
        profanityFilter: profanityFilter ?? false,
        requireModeration: requireModeration ?? false,
        updatedBy: adminId
      }
    })

    res.json({
      message: 'Настройки штаба обновлены',
      settings: updatedSettings
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка обновления настроек:', error)
    res.status(500).json({
      error: 'Ошибка обновления настроек штаба',
      code: 'SETTINGS_UPDATE_ERROR'
    })
  }
})

/**
 * POST /api/admin/system/banned-words
 * Добавление слова в бан-лист
 */
router.post('/system/banned-words', logAdminAction, async (req, res) => {
  try {
    const { word } = req.body
    const adminId = req.userId

    if (!word || typeof word !== 'string' || word.trim().length < 2) {
      return res.status(400).json({
        error: 'Некорректное слово',
        code: 'INVALID_WORD'
      })
    }

    const normalizedWord = word.trim().toLowerCase()

    const bannedWord = await prisma.bannedWord.create({
      data: {
        word: normalizedWord,
        addedBy: adminId!
      }
    })

    res.json({
      message: `Слово "${normalizedWord}" добавлено в бан-лист`,
      word: bannedWord.word
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Это слово уже в бан-листе',
        code: 'WORD_ALREADY_BANNED'
      })
    }
    console.error('[ADMIN] Ошибка добавления слова:', error)
    res.status(500).json({
      error: 'Ошибка добавления слова в бан-лист',
      code: 'BANNED_WORD_ADD_ERROR'
    })
  }
})

/**
 * DELETE /api/admin/system/banned-words/:word
 * Удаление слова из бан-листа
 */
router.delete('/system/banned-words/:word', logAdminAction, async (req, res) => {
  try {
    const { word } = req.params
    const normalizedWord = word.toLowerCase()

    await prisma.bannedWord.delete({
      where: { word: normalizedWord }
    })

    res.json({
      message: `Слово "${normalizedWord}" удалено из бан-листа`
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка удаления слова:', error)
    res.status(500).json({
      error: 'Ошибка удаления слова из бан-листа',
      code: 'BANNED_WORD_DELETE_ERROR'
    })
  }
})

// ==== 4. ПРОСМОТР ЛОГОВ =====

/**
 * GET /api/admin/logs
 * Получение логов действий админов
 */
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, offset = 0, adminId, action } = req.query

    const where: any = {}
    if (adminId) where.adminId = String(adminId)
    if (action) where.action = String(action)

    const logs = await prisma.adminLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        targetId: true,
        details: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    })

    const total = await prisma.adminLog.count({ where })

    res.json({
      logs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + Number(limit)
      }
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка получения логов:', error)
    res.status(500).json({
      error: 'Ошибка загрузки журнала действий',
      code: 'LOGS_FETCH_ERROR'
    })
  }
})

/**
 * GET /api/admin/stats
 * Получение статистики для дашборда
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      onlineUsers,
      totalMessages,
      totalAdmins,
      bannedUsers,
      messagesToday
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { online: true } }),
      prisma.message.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.userBan.count(),
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ])

    res.json({
      totalUsers,
      onlineUsers,
      totalMessages,
      totalAdmins,
      bannedUsers,
      messagesToday,
      onlinePercentage: totalUsers ? Math.round((onlineUsers / totalUsers) * 100) : 0
    })
  } catch (error) {
    console.error('[ADMIN] Ошибка получения статистики:', error)
    res.status(500).json({
      error: 'Ошибка загрузки статистики',
      code: 'STATS_FETCH_ERROR'
    })
  }
})

export default router