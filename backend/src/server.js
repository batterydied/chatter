import 'dotenv/config'
import express from "express"
import UserRoutes from "./routes/userRoutes.js"
import RelationRoutes from "./routes/relationRoutes.js"
import ConversationRoutes from "./routes/conversationRoutes.js"
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5001

app.use(cors({
  origin: ['https://chatter-s3t1.vercel.app', 'http://localhost:5173'],
  credentials: true
}))

app.use(express.urlencoded({extended: true, limit: '10mb'}))
app.use(express.json({ limit: '10mb' }))

app.use('/api/user', UserRoutes)
app.use('/api/relation', RelationRoutes)
app.use('/api/conversation', ConversationRoutes)

app.get('/', (req, res) => {
    res.send({message: 'You have reached the server.'})
})


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})


export default app