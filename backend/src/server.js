import 'dotenv/config'
import express from "express"
import UserRoutes from "./routes/userRoutes.js"
import RelationRoutes from "./routes/relationRoutes.js"
import ConversationRoutes from "./routes/conversationRoutes.js"
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5001
const MODE = process.env.MODE

app.use(cors({
  origin: MODE !== 'production' ? 'http://localhost:5173' : FRONTEND_URL,
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

if(process.env.MODE !== 'production'){
  app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
  })
}

export default app