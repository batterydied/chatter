import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, query, where, deleteDoc, getDoc, doc, serverTimestamp } from "firebase/firestore"
import ConversationSchema from "../models/conversationModel"

class ConversationController{
    async createConversation(req, res){
        const collectionRef = collection(db, 'conversations')

        const { participants } = req.body
        const conversation = {
            participants,
            createdAt: serverTimestamp()
        }

        try{
            ConversationSchema.parse(conversation)
            const doc = await addDoc(collectionRef, conversation)
            res.status(201).json({status: 'Success', data:
                {
                    ...doc,
                    createdAt: doc.data().createdAt.toDate().toISOString()
                }
            })
        }catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to create conversation, error: ${e}`})
        }
    }
}

export default new ConversationController()