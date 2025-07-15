import express from 'express'
import UserController from '../controllers/userControllers.js'

const router = express.Router()

router.post('/', UserController.createUser)

router.get('/:id', UserController.retrieveUserById)

router.delete('/:id', UserController.deleteUserById)

export default router

