import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, query, where, deleteDoc, getDoc, doc, serverTimestamp } from "firebase/firestore"
import ConversationSchema from "../models/conversationModel.js"

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

    async getConversationById(req, res){
        const { conversationId } = req.params
        const docRef = doc(db, 'conversations', conversationId)
        try{
            const doc = await getDoc(docRef)
            if(!doc.exists()){
                return res.status(404).json({status: 'Failure', message: 'Conversation not found'})
            }
            res.status(200).json({status: 'Success', data: doc.data()})
        }catch(e){
            res.status(400).json({status: 'Failure', message: `Failed to get conversation, error: ${e}`})
        }
    }
}

export default new ConversationController()