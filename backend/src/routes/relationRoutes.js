import express from 'express'
import RelationController from '../controllers/relationController'
const router = express.Router()

router.get('/pending', (req, res) => {
    RelationController.getPendingRequests()
})

router.get('/friend', (req, res) => {
    RelationController.getFriends()
})

router.get('/blocked', (req, res) => {
    RelationController.getBlockedUsers()
})  

export default router