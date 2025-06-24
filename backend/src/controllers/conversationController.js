import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, query, where, deleteDoc, getDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import ConversationSchema from "../models/conversationModel.js"
import { deleteAllMessagesHelper } from './messageController.js'

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
            const docRef = await addDoc(collectionRef, conversation)
            const docSnapshot = await getDoc(docRef)
            res.status(201).json({status: 'Success', data:
                {
                    conversationId: docSnapshot.id,
                    ...docSnapshot.data(),
                    createdAt: docSnapshot.data().createdAt.toDate().toISOString()
                }
            })
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to create conversation', error: e instanceof Error ? e.message : e})
        }
    }

    async getConversationById(req, res){
        const { conversationId } = req.params
        const docRef = doc(db, 'conversations', conversationId)
        try{
            const docSnapshot = await getDoc(docRef)
            if(!docSnapshot.exists()){
                return res.status(404).json({status: 'Failure', message: 'Conversation not found'})
            }
            res.status(200).json({status: 'Success', data: 
                {
                    conversationId,
                    ...docSnapshot.data(),
                    createdAt: docSnapshot.data().createdAt.toDate().toISOString()
                }
            })
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to get conversation', error: e instanceof Error ? e.message : e})
        }
    }

    async getAllConversationsByUserId(req, res){
        const { userId } = req.params
        const queryRef = query(
            collection(db, 'conversations'), 
            where('participants', 'array-contains', userId),
            orderBy('lastMessageTime', 'desc')
        )
        try{
            const conversationSnapshot = await getDocs(queryRef)
      
            res.status(200).json({
                status: 'Success', 
                conversations: conversationSnapshot.docs.map((doc)=>
                    ({
                        id: doc.id,
                        ...doc.data()
                    }))
            })

        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to get conversations', error: e instanceof Error ? e.message : e})
        }
    }

    async updateConversationById(req, res){
        const { conversationId } = req.params
        const { participants, hiddenBy, mutedBy, lastMessageTime } = req.body
        const conversationRef = doc(db, 'conversations', conversationId)
        try{
            const conversationSnapshot = await getDoc(conversationRef)
            if(!conversationSnapshot.exists()){
                return res.status(404).json({status: 'Failure', message: 'Conversation not found', error: e instanceof Error ? e.message : e})
            }
            const data = conversationSnapshot.data()
            const updatedFields = {
                participants: participants ?? data.participants,
                hiddenBy: hiddenBy ?? data.hiddenBy,
                mutedBy: mutedBy ?? data.mutedBy,
                lastMessageTime: lastMessageTime ?? data.lastMessageTime
            }

            ConversationSchema.parse(updatedFields)
            await updateDoc(conversationRef, updatedFields)

            res.status(200).json({status: 'Success', updatedFields})

        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to update conversation', error: e instanceof Error ? e.message : e})
        }

    }

    async deleteConversationById(req, res){
        try{
            const { conversationId } = req.params
            await deleteAllMessagesHelper(conversationId)
            const docRef = doc(db, 'conversations', conversationId)

            await deleteDoc(docRef)
            res.status(200).json({status: 'Success', message: 'Conversation deleted successfully'})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to delete conversation', error: e instanceof Error ? e.message : e})
        }
    }
}

export default new ConversationController()