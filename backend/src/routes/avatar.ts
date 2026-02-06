import { Router } from 'express'
import { getUsedAvatars, getAllAvatars } from '../controllers/avatarController'
import { auth } from '../middleware/auth'

const router = Router()

// Получить список занятых аватаров (только для авторизованных)
router.get('/used-avatars', auth, getUsedAvatars)

// Получить все аватары с информацией о занятости
router.get('/all', auth, getAllAvatars)

export default router