import express from 'express'
import ConversationController from '../controllers/conversationController.js'
import MessageRoutes from '../routes/messageRoutes.js'

const router = express.Router()

router.use('/:conversationId/message', MessageRoutes)

router.get('/user/:userId', ConversationController.getAllConversationsByUserId)
router.get('/:conversationId', ConversationController.getConversationById)
router.post('/', ConversationController.createConversation)
router.patch('/:conversationId', ConversationController.updateConversationById)
router.delete('/:conversationId', ConversationController.deleteConversationById)

export default router
