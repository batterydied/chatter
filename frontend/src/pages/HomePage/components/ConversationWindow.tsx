import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { db } from '../../../config/firebase'
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { Firestore, Timestamp } from 'firebase/firestore';
import useAutoScroll from '../../../hooks/useAutoScroll'

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
  const [loading, setLoading] = useState(true)
  const [hoverMessageId, setHoverMessageId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [earliestMessageId, setEarliestMessageId] = useState<string | null>(null)

  const { scrollContainerRef, setShouldScrollToBottom, isUserNearBottom, bottomRef } = useAutoScroll(messages)

  const inputRef = useCallback((ele: HTMLInputElement | null) => {
    if (ele) {
      ele.focus();
    }
  }, []);

  const serializeMessages = async (rawMessages: RawMessage[], db: Firestore) => {
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

  const fetchMessages = useCallback(async (size: number, prevMessageId: string | null) => {
    const params = {size, prevMessageId}
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversationId}/message/page`,
        {params}
      )

      const rawMessages: RawMessage[] = res.data.messages
      setHasMore(!res.data.noMore)

      const serialized = await serializeMessages(rawMessages, db)
      if(serialized.length > 0) {
        setEarliestMessageId(serialized[0].id);
        setMessages(serialized);
      }

      setShouldScrollToBottom(true)

      setLoading(false)

      return(serialized)

    } catch (e) {
      if (axios.isAxiosError(e)) {
        console.log(e.message)
      } else {
        console.log(e)
      }
      return []
    }
  }, [conversationId, setShouldScrollToBottom])

  const handleSelectHoverId = (msgId: string)=>{
    setHoverMessageId(msgId)
  }

  const handleRemoveHoverId = () => {
    setHoverMessageId(null)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if(inputMessage){
      console.log(inputMessage)
      uploadMessage(conversationId, userId, inputMessage)
      setShouldScrollToBottom(true)
      setInputMessage('')
    }
  }

  const renderMessages = (messages: SerializedMessage[], userId: string) => {
    if(messages.length != 0){
      return messages.map((msg, i) => {
        const prev = messages[i - 1];
        const isGrouped =
          prev &&
          prev.senderId === msg.senderId &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime()) < 2 * 60 * 1000;
        const isHovered = hoverMessageId === msg.id;

        return (
  <div
    className="relative"
    onMouseLeave={handleRemoveHoverId}
    onMouseEnter={() => handleSelectHoverId(msg.id)}
  >
    {/* Actual chat message */}
    <div
      className={`chat chat-start ${isHovered && 'bg-base-200'} relative`}
    >
      {!isGrouped && (
        <div className="chat-header">
          {msg.username}
          <time className="text-xs opacity-50 ml-2">{msg.messageTime}</time>
        </div>
      )}
      <div className={`chat-bubble bg-base-100 ${isGrouped ? 'mt-1' : 'mt-3'}`}>
        {msg.text}
      </div>
    </div>
    
    {isHovered && (
      <div
        className="absolute right-4 -top-2 p-1 bg-base-200 outline-1"
      >
        <span>placeholder</span>
      </div>
    )}
  </div>
)

      })
    }else{
      return (
        <div>
          <span>This is the beginning of your direct message history!</span> 
        </div>)
    } 
  }
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setMessages([])
      await fetchMessages(15, null)
    }
    init()
  }, [fetchMessages])

  useEffect(() => {
    const queryRef = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const unsub = onSnapshot(queryRef, async (snapshot) => {
      const rawMessages: RawMessage[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          createdAt: data.createdAt,
          senderId: data.senderId,
          text: data.text,
          type: data.type
        };
      });

      const serializedMessages = await serializeMessages(rawMessages, db);
      
      setMessages((prev) => {
        const newMessage = serializedMessages[0];
        if (!newMessage) return prev;
        
        const exists = prev.some((m) => m.id === newMessage.id);
        if (exists) return prev;
        
        // Check scroll position before updating messages
        const container = scrollContainerRef.current;
        const nearBottom = isUserNearBottom(container);

        if(nearBottom){
          setShouldScrollToBottom(true);
        }
        
        return [...prev, newMessage];
      });
    });
    
    return unsub;
  }, [conversationId, isUserNearBottom, scrollContainerRef, setShouldScrollToBottom]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const fetchMoreMessages = async () => {
      if (!earliestMessageId || loadingMore || !hasMore) return

      const oldScrollHeight = scrollContainer.scrollHeight

      setLoadingMore(true)
      setShouldScrollToBottom(false)

      try {
        const axiosParams = {
          params: {
            size: 15,
            prevMessageId: earliestMessageId,
          },
        }

        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversationId}/message/page`,
          axiosParams
        )

        const rawMessages: RawMessage[] = res.data.messages
        const serialized = await serializeMessages(rawMessages, db)

        setMessages((prev) => [...serialized, ...prev])
        if (serialized.length > 0) {
          setEarliestMessageId(serialized[0].id)
        }

        setHasMore(!res.data.noMore)
        requestAnimationFrame(() => {
          const newScrollHeight = scrollContainer.scrollHeight
          scrollContainer.scrollTop += newScrollHeight - oldScrollHeight
        })
      } catch (e) {
        if (axios.isAxiosError(e)) {
          console.log(e.message)
        } else {
          console.log(e)
        }
      } finally {
        setLoadingMore(false)
      }
    }

    const handleScroll = () => {
      if (scrollContainer.scrollTop < 50 && !loadingMore && hasMore) {
        fetchMoreMessages()
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [earliestMessageId, hasMore, loadingMore, conversationId, scrollContainerRef, setShouldScrollToBottom])


  if(!messages){
    return (
        <div className="w-full h-full flex justify-center items-center">
            <span className="loading loading-ring loading-xl"></span>
        </div>
    );
  }
  if(loading){
    return (
      <div className="w-full h-full flex justify-center items-center">
        <span className="loading loading-ring loading-xl"></span>
      </div>
    )
  } 
  return (
    <div className='h-full w-full flex flex-col'>
      <div className='flex-1 overflow-y-auto' ref={scrollContainerRef}>
        {loadingMore && <span className="loading loading-dots loading-md"></span>}
        <div className='mt-3'>{renderMessages(messages, userId)}</div>
        <div ref={bottomRef}></div>
      </div>
      <form onSubmit={handleSubmit}>
        <input placeholder={'Type a message...'} value={inputMessage} onChange={(e)=>setInputMessage(e.target.value)} type="text" className="input input-md items-end w-full focus:outline-0 mt-2" ref={inputRef}/>
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



export default ConversationWindow
