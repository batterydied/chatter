import express from 'express'
import UserController from '../controllers/userControllers.js'

const router = express.Router()

router.post('/offline', UserController.updateStatusOffline)

router.post('/online', UserController.updateStatusOnline)

router.post('/:id', UserController.updateUserById)

router.post('/', UserController.createUser)

router.get('/:email', UserController.retrieveUserByEmail)

router.delete('/:id', UserController.deleteUserById)


export default router

