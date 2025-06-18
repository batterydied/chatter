import express from 'express'
import UserController from '../controllers/userControllers.js'

const router = express.Router()

router.post('/create', UserController.createUser)

router.get('/retrieve/:email', UserController.retrieveUserByEmail)

router.delete('/delete/:email', UserController.deleteUserByEmail)

export default router

