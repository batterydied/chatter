import { useState, useEffect } from 'react'
import axios from 'axios'
import { db } from '../../../config/firebase'
import { doc, getDoc } from 'firebase/firestore'

type ConversationWindowProps = {
  conversationId: string,
  userId: string
}

type RawMessage = {
  id: string
  createdAt: string
  senderId: string
  text: string
  type: string
}

type SerializedMessage = {
  id: string
  text: string
  username: string
  messageTime: string,
  senderId: string
}

const ConversationWindow = ({ conversationId, userId }: ConversationWindowProps) => {
  const [messages, setMessages] = useState<SerializedMessage[]>([])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversationId}/message`
        )

        const rawMessages: RawMessage[] = res.data.messages

        const serialized = await Promise.all(
          rawMessages.map(async (m) => {
            const docRef = doc(db, 'users', m.senderId)
            const docSnap = await getDoc(docRef)
            console.log(docSnap.data())
            const username = docSnap.exists()
              ? docSnap.data().username
              : 'Unknown User'

            const messageTime = formatMessageTime(new Date(m.createdAt))

            return {
              id: m.id,
              text: m.text,
              username,
              messageTime,
              senderId: m.senderId
            }
          })
        )

        setMessages(serialized)
      } catch (e) {
        if (axios.isAxiosError(e)) {
          console.log(e.message)
        } else {
          console.log('Unknown error occurred')
        }
      }
    }

    fetchMessages()
  }, [conversationId])
  if(!messages){
    return (
        <div className="w-full h-full flex justify-center items-center">
            <span className="loading loading-ring loading-xl"></span>
        </div>
    );
  }
  return (
    <div className='w-full'>
      {messages.map((msg) => (
        <div className={`chat ${userId == msg.senderId ? 'chat-end' : 'chat-start'}`} key={msg.id}>
          <div className="chat-header">
            {msg.username}
            <time className="text-xs opacity-50 ml-2">{msg.messageTime}</time>
          </div>
          <div className="chat-bubble">{msg.text}</div>
        </div>
      ))}
    </div>
  )
}

const formatMessageTime = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

  if(diffInDays > 1){
    // More than 1 day ago → full date + time
    return date.toLocaleString('en-US', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }else{
    // Within 1 day → only time
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }
}

export default ConversationWindow
