import { db } from '../config/firebase.js'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, getDoc, doc, serverTimestamp } from "firebase/firestore"
import MessageSchema from '../models/messageModel.js'

class MessageController{
    async getAllMessages(req, res){
        const { conversationId } = req.params
        const queryRef = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'))

        try{
            const messageSnapshot = await getDocs(queryRef)

            res.status(200).json({status: 'Success', messages: messageSnapshot.docs.map(
                (doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt.toDate().toISOString()
                })
            )})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to get messages', error: e instanceof Error ? e.message : e})
        }
    }

    async getMessage(req, res){
        const { conversationId, messageId } = req.params
        const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)
        try{
            const messageDoc = await getDoc(messageRef)
            if(!messageDoc.exists()){
                return res.status(404).json({status: 'Failure', message: 'Message not found'})
            }
            res.status(200).json({status: 'Success', data: 
                {
                    messageId,
                    ...messageDoc.data(),
                    createdAt: messageDoc.data().createdAt.toDate().toISOString()

                }
            })
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to get message', error: e instanceof Error ? e.message : e})
        }
    }

    async createMessage(req, res){
        const { conversationId } = req.params

        const { senderId, type, text, fileUrl, fileName, fileSize } = req.body
        const conversationRef = doc(db, 'conversations', conversationId)
        const messageCollectionRef = collection(db, 'conversations', conversationId, 'messages')

        try{
            const rawMessage = {
                senderId,
                type,
                text,
                fileUrl,
                fileName,
                fileSize,
                createdAt: serverTimestamp()
            }

            MessageSchema.parse(rawMessage)

            const message = Object.fromEntries(Object.entries(rawMessage).filter(([_, val]) => val !== undefined))

            const data = await addDoc(messageCollectionRef, message)
            const messageDoc = await getDoc(data)

            const updatedMessageTime = {
                lastMessageTime: serverTimestamp()
            }
            await updateDoc(conversationRef, updatedMessageTime)

            res.status(201).json({status: 'Success', data: 
                {
                    messageId: messageDoc.id,
                    ...messageDoc.data(),
                    createdAt: messageDoc.data().createdAt.toDate().toISOString()
                }
            })
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to create message', error: e instanceof Error ? e.message : e})
        }
    }

    async editMessage(req, res){
        const { conversationId, messageId } = req.params
        const { type, text } = req.body

        if(type !== 'text'){
            return res.status(400).json({status: 'Failure', message: `Only text can be edited`})
        }

        const docRef = doc(db, 'conversations', conversationId, 'messages', messageId)

        try{
            const updatedFields = {
                text,
                updatedAt: serverTimestamp()
            }

            await updateDoc(docRef, updatedFields)

            res.status(200).json({status: 'Success', updatedText: text})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to edit message', error: e instanceof Error ? e.message : e})
        }
    }

    async deleteMessage(req, res){
        const { conversationId, messageId } = req.params
        const docRef = doc(db, 'conversations', conversationId, 'messages', messageId)

        try{
            await deleteDoc(docRef)
            res.status(200).json({status: 'Success'})
        }catch(e){
            res.status(500).json({status: 'Failure', message: 'Failed to delete message', error: e instanceof Error ? e.message : e})
        }
    }

    async deleteAllMessages(req, res){
        const { conversationId } = req.params
        try{
            await deleteAllMessagesHelper(conversationId)
            res.status(200).json({
                status: 'Success', 
                message: `Successfully deleted all messages for conversation ${conversationId}`
            })
        }catch(e){
            res.status(500).json({status: 'Failure', message: `Failed to delete all messages for conversation ${conversationId}`})
        }
    }
    
}

//This function isn't part of routes, it's a helper
export async function deleteAllMessagesHelper(conversationId){
    const messagesRef = collection(db, 'conversations', conversationId, 'messages')
    const messagesSnapshot = await getDocs(messagesRef)

    const deletions = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletions)
}

export default new MessageController()