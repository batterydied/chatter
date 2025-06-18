import 'dotenv/config'
import express from "express"
import UserRoutes from "./routes/userRoutes.js"
import RelationRoutes from "./routes/relationRoutes.js"

const app = express()
const PORT = 5001

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use('/api/user', UserRoutes)
app.use('/api/relation', RelationRoutes)

app.get('/', (req, res) => {
    res.send({message: 'You have reached the server.'})
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
