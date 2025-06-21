import express from 'express'
import RelationController from '../controllers/relationController.js'

const router = express.Router()

router.get('/pending/received/:id', RelationController.getReceivedPendingRequests)

router.get('/pending/sent/:id', RelationController.getSentPendingRequests)

router.get('/friend/:id', RelationController.getFriends)

router.get('/blocked/:id', RelationController.getBlockedUsers)  

router.post('/confirm/:docId', RelationController.confirmFriendRequest)

router.post('/friend-request', RelationController.sendFriendRequest)

router.delete('/delete-friend', RelationController.deleteFriend)

router.post('/block', RelationController.blockUser)

router.post('/unblock', RelationController.unblockUser)
export default router