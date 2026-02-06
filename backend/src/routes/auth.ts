import { Router } from 'express'
import { login, profile, updateAvatar } from '../controllers/authController'
import { auth } from '../middleware/auth'
const router = Router()

router.post('/login', login)
router.get('/profile', auth, profile)
router.patch('/avatar', auth, updateAvatar)  // ← НОВЫЙ РОУТ

export default router