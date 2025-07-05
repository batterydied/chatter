import express from 'express'
import MessageController from '../controllers/messageController.js'
const router = express.Router({mergeParams: true})

router.get('/', MessageController.getAllMessages)
router.get('/page', MessageController.getMessagesByPagination)
router.get('/:messageID', MessageController.getMessage)
router.post('/', MessageController.createMessage);
router.put('/:messageID', MessageController.editMessage)
router.delete('/:messageID', MessageController.deleteMessage)
router.delete('/', MessageController.deleteAllMessages)
export default router