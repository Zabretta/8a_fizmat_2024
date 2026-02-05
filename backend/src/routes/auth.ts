import { Router } from 'express'
import { login, profile } from '../controllers/authController'
import { auth } from '../middleware/auth'
const router = Router()

// Убираем регистрацию, оставляем только вход
router.post('/login', login)
router.get('/profile', auth, profile)

export default router