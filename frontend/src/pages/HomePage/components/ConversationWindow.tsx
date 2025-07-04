import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { db } from '../../../config/firebase'
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { Firestore, Timestamp } from 'firebase/firestore';

type ConversationWindowProps = {
  conversationId: string,
  userId: string,
}

type RawMessage = {
  id: string
  createdAt: string | Timestamp //if you get it from backend api, it's a string; if you use firebase snapshot, it's a timestamp
  senderId: string
  text: string
  type: string
}

type SerializedMessage = {
  id: string
  text: string
  username: string
  messageTime: string,
  senderId: string,
  timestamp: Date
}

const ConversationWindow = ({ conversationId, userId }: ConversationWindowProps) => {
  const [messages, setMessages] = useState<SerializedMessage[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [inputMessage, setInputMessage] = useState('')

  async function serializeMessages(rawMessages: RawMessage[], db: Firestore) {
    return await Promise.all(
      rawMessages.map(async (m) => {
        const docRef = doc(db, 'users', m.senderId);
        const docSnap = await getDoc(docRef);
        const username = docSnap.exists()
          ? docSnap.data().username
          : 'Unknown User';
        
        
        const timestamp = typeof m.createdAt === 'string' ? new Date(m.createdAt) : m.createdAt.toDate()
        const messageTime = formatMessageTime(timestamp)
        return {
          id: m.id,
          text: m.text,
          username,
          messageTime,
          senderId: m.senderId,
          timestamp
        };
      })
    );
  }

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversationId}/message`
      )

      const rawMessages: RawMessage[] = res.data.messages

      const serialized = await serializeMessages(rawMessages, db)

      setMessages(serialized)
    } catch (e) {
      if (axios.isAxiosError(e)) {
        console.log(e.message)
      } else {
        console.log('Unknown error occurred')
      }
    }
  }, [conversationId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if(inputMessage){
      console.log(inputMessage)
      uploadMessage(conversationId, userId, inputMessage)
      setInputMessage('')
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(()=>{
    inputRef.current?.focus()
  }, [conversationId])

  useEffect(() => {
    if(shouldScrollToBottom){
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(()=>{
    const queryRef = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt'))
    const unsub = onSnapshot(queryRef, async (snapshot)=>{
    const rawMessages: RawMessage[] = snapshot.docs.map((doc)=>{
      const data = doc.data()
      return {
          id: doc.id,
          createdAt: data.createdAt,
          senderId: data.senderId,
          text: data.text,
          type: data.type
        }
      })

      const serializedMessages = await serializeMessages(rawMessages, db)
      console.log(serializedMessages)

      setMessages(serializedMessages)
    })
    return unsub
  }, [conversationId])

  if(!messages){
    return (
        <div className="w-full h-full flex justify-center items-center">
            <span className="loading loading-ring loading-xl"></span>
        </div>
    );
  }
  return (
    <div className='h-full w-full flex flex-col'>
      <div className='flex-1 overflow-y-auto'>
        {renderMessages(messages, userId)}
        <div ref={bottomRef}></div>
      </div>
      <form onSubmit={handleSubmit}>
        <input value={inputMessage} onChange={(e)=>setInputMessage(e.target.value)} type="text" className="input input-md items-end w-full focus:outline-0 mt-2" ref={inputRef}/>
      </form>
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

const uploadMessage = async (conversationId: string, userId: string, inputMessage: string) => {
  try{
    const message = {
      senderId: userId,
      type: 'text',
      text: inputMessage
    }
    await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversationId}/message`, message)
  }catch(e){
    if(axios.isAxiosError(e)){
      console.log(e.message)
    }else{
      console.log('Unknown error occurred')
    }
  }
}

const renderMessages = (messages: SerializedMessage[], userId: string) => {
  return messages.map((msg, i) => {
    const prev = messages[i - 1];
    const isGrouped =
      prev &&
      prev.senderId === msg.senderId &&
      Math.abs(new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime()) < 2 * 60 * 1000;

    return (
      <div className={`chat ${userId === msg.senderId ? 'chat-end' : 'chat-start'}`} key={msg.id}>
        {!isGrouped && (
          <div className="chat-header">
            {msg.username}
            <time className="text-xs opacity-50 ml-2">{msg.messageTime}</time>
          </div>
        )}
        <div className={`chat-bubble bg-base-100 ${isGrouped ? 'mt-1' : 'mt-3'}`}>{msg.text}</div>
      </div>
    );
  });
};



export default ConversationWindow
