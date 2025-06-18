import express from 'express'
import RelationController from '../controllers/relationController.js'

const router = express.Router()

router.get('/pending/received/:id', RelationController.getReceivedPendingRequests)

router.get('/pending/sent/:id', RelationController.getSentPendingRequests)

router.get('/friend/:id', RelationController.getFriends)

router.get('/blocked/:id', RelationController.getBlockedUsers)  

router.post('/friend-request/', RelationController.sendFriendRequest)

router.post('/confirm/:docId', RelationController.confirmFriendRequest)

router.delete('/delete-friend', RelationController.deleteFriend)


export default router