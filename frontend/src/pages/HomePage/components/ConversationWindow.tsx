import { useState, useEffect } from 'react'
import axios from 'axios'

type ConversationWindowProps = {
    conversationId: string
}

type Message = {
    id: string
    createdAt: string,
    senderId: string,
    text: string,
    type: string
}

const ConversationWindow = ({conversationId}: ConversationWindowProps) => {
    const [messages, setMessages] = useState<Message[]>([])

    useEffect(()=>{
        const fetchMessages = async () => {
            await getConversation(conversationId, setMessages)
        }   
        
        fetchMessages()

    }, [conversationId])

    return (
        <div>
            {renderMessages(messages)}
        </div>
    )


}

const getConversation = async (conversationId: string, setMessages: (messages: Message[]) => void) => {
    try{
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversationId}/message`)
        setMessages(res.data.messages)
    }catch(e){
        if (axios.isAxiosError(e)) {
            console.log(e.message)
        }else{
            console.log('Unknown error occurred')
        }
    }

}

const renderMessages = (messages: Message[]) => {
    return messages.map((m)=>{
        return (
            <div className="chat-bubble">{m.text}</div>
        )
    })
}

export default ConversationWindow