import express from 'express'
import UserController from '../controllers/userControllers.js'

const router = express.Router()

router.post('/', UserController.createUser)

router.get('/:email', UserController.retrieveUserByEmail)

router.delete('/:email', UserController.deleteUserByEmail)

export default router

