import express from 'express'
import UserController from '../controllers/userControllers.js'

const router = express.Router()

router.post('/create', (req, res) => {
    UserController.createUser(req, res)
})

router.get('/retrieve/:id', (req, res) => {
    UserController.retrieveUser(req, res)
})

router.delete('/delete/:id', (req, res) => {
    UserController.deleteUser(req, res)
})

export default router

