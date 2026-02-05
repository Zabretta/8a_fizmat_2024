
import { Router } from 'express'
import { getMessages } from '../controllers/chatController'
import { auth } from '../middleware/auth'
const router = Router()

router.get('/messages', auth, getMessages)

export default router