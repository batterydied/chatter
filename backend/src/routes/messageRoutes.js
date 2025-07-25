import express from 'express'
import MessageController from '../controllers/messageController.js'
const router = express.Router({mergeParams: true})

router.get('/', MessageController.getAllMessages)
router.get('/page', MessageController.getMessagesByPagination)
router.get('/:messageId', MessageController.getMessage)
router.post('/', MessageController.createMessage);
router.put('/:messageId', MessageController.editMessage)
router.delete('/:messageId', MessageController.deleteMessage)
router.delete('/', MessageController.deleteAllMessages)
export default router