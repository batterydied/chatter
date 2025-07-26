import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { db } from '../../../config/firebase'
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { Firestore, Timestamp } from 'firebase/firestore'
import useAutoScroll from '../../../hooks/useAutoScroll'
import { EditIcon, ReactIcon, ReplyIcon, DeleteIcon } from '../../../assets/icons'
import { toast } from 'sonner'

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
  isEdited: boolean,
  isReply: boolean,
  replyId: string
}

type SerializedMessage = {
  id: string
  text: string
  username: string
  messageTime: string,
  senderId: string,
  timestamp: Date,
  isEdited: boolean,
  isReply: boolean,
  replyId: string
}

const ConversationWindow = ({ conversationId, userId }: ConversationWindowProps) => {
  const [messages, setMessages] = useState<SerializedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [earliestMessageId, setEarliestMessageId] = useState<string | null>(null)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<SerializedMessage | null>(null)
  const [deletedMessageIds, setDeletedMessageIds] = useState<string[]>([])
  const [editMessage, setEditMessage] = useState<SerializedMessage | null>(null)
  const [editMessageInputMessage, setEditMessageInputMessage] = useState('')
  const [replyMessage, setReplyMessage] = useState<SerializedMessage | null>(null)
  const [replyUsername, setReplyUsername] = useState<string | null>(null)

  const { scrollContainerRef, setShouldScrollToBottom, isUserNearBottom, bottomRef } = useAutoScroll(messages)

  const inputElRef = useRef<HTMLInputElement | null>(null);

  const inputRef = useCallback((ele: HTMLInputElement | null) => {
    if(ele){
      inputElRef.current = ele;
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
          : 'Deleted User';
        
        
        const timestamp = typeof m.createdAt === 'string' ? new Date(m.createdAt) : m.createdAt.toDate()
        const messageTime = formatMessageTime(timestamp)
        return {
          id: m.id,
          text: m.text,
          username,
          messageTime,
          senderId: m.senderId,
          timestamp,
          isEdited: m.isEdited,
          isReply: m.isReply,
          replyId: m.replyId
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
    setHoveredMessageId(msgId)
  }

  const handleRemoveHoverId = () => {
    setHoveredMessageId(null)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if(inputMessage){
      uploadMessage(conversationId, userId, inputMessage)
      setShouldScrollToBottom(true)
      setInputMessage('')
    }
  }

  const handleDeleteConfirmation = (msg: SerializedMessage) => {
    setDeleteMessage(msg);
    (document.getElementById('delete_confirmation_modal') as HTMLDialogElement)!.showModal();
  }

  const sendDelete = async (msgId: string) => {
    try{
      await axios.delete(`${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversationId}/message/${msgId}`)
      setDeletedMessageIds((prev) => [...prev, msgId])
    }catch{
      toast.error('Could not delete message, try again later.')
    }
  }

  const handleEdit = (msg: SerializedMessage) => {
    setEditMessage(msg)
    setEditMessageInputMessage(msg.text)
  }
  
  const cancelEdit = () => {
    setEditMessage(null)
  };

  const handleReply = (msg: SerializedMessage) => {
    setReplyMessage(msg)
    inputElRef.current?.focus();
  }

  const handleUpdate = useCallback((msg: SerializedMessage, updatedMsg: string) => {
    const sendUpdate = async (msgId: string, updatedMsg: string) => {
      try{
        await axios.put(`${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversationId}/message/${msgId}`, 
          {
            type: 'text',
            text: updatedMsg
          })
        setMessages((prevMessages) =>
          prevMessages.map((m) =>
            m.id === msg.id ? { ...m, text: updatedMsg, isEdited: true } : m
          )
        );
      }catch{
        toast.error('Could not edit message, try again later.')
      }
    }
    if(updatedMsg === ''){
      handleDeleteConfirmation(msg)
    }
    else if(msg.text !== updatedMsg){
      sendUpdate(msg.id, updatedMsg)
    }
    setEditMessage(null)
  }, [conversationId])

  useEffect(() => {
    if (!replyMessage) {
      setReplyUsername(null);
      return;
    }

    const fetchUsername = async () => {
      const userRef = doc(db, 'users', replyMessage.senderId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setReplyUsername(userSnap.data().username);
      } else {
        setReplyUsername('Deleted User');
      }
    };

    fetchUsername();
  }, [replyMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelEdit();
      }
      if(e.key === 'Enter'){
        handleUpdate(editMessage!, editMessageInputMessage)
      }
    };

    if (editMessage) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editMessage, editMessageInputMessage, handleUpdate]);


  const renderMessages = (messages: SerializedMessage[], userId: string) => {
    if(messages.length != 0){
      return messages.map((msg, i) => {
        if (deletedMessageIds.includes(msg.id)) return null;
        const prev = messages[i - 1];
        const isGrouped =
          prev &&
          prev.senderId === msg.senderId &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime()) < 2 * 60 * 1000;
        const isHovered = hoveredMessageId === msg.id
        const isUser = userId === msg.senderId
        const isEditingMessage = editMessage?.id === msg.id
        const isReply = replyMessage?.id === msg.id

        return (
          <div
            key={msg.id}
            className="relative"
            onMouseLeave={handleRemoveHoverId}
            onMouseEnter={() => handleSelectHoverId(msg.id)}
          >
            <div
              className={`chat rounded-md ${isUser ? 'chat-end' : 'chat-start'} ${
                isReply && isHovered ? 
                'bg-blue-900'
                : isReply ? 
                'bg-blue-950'
                : isHovered ?
                'bg-base-200'
                : 'bg-base-300'
              } relative`}
            >
              <div className="chat-image avatar">
                <div className="w-10 rounded-full bg-base-100 flex items-center justify-center">
                  <span className="text-xl">{msg.senderId.slice(0, 2)}</span>
                </div>
              </div>
              {!isGrouped && (
                <div className="chat-header">
                  <p>{msg.username}</p>
                  <time className="text-xs opacity-50 ml-2">{msg.messageTime}</time>
                </div>
              )}
              <div className={`chat-bubble bg-base-100 ${isGrouped ? 'mt-1' : 'mt-3'}`}>
                {isEditingMessage ? 
                <div>
                  <input ref={inputRef} onChange={(e) => setEditMessageInputMessage(e.target.value)} className='w-full focus:outline-none' value={editMessageInputMessage}/>
                  <p className='text-sm'>Escape to <span className='text-accent'>cancel</span>, enter to <span className='text-accent'>save</span></p>
                </div> 
                : 
                <div>
                  {msg.text}
                  {msg.isEdited && <span className={`absolute bottom-0 ${isUser ? 'right-full' : 'left-full'} px-2 text-xs text-gray-300`}>(edited)</span>}
                </div>
                }
              </div>
            </div>
            
            {isHovered && (
              <div
                className="absolute right-4 -top-2 p-2 bg-base-100 outline-1 outline-base-200 rounded-md flex items-center"
              >
                <button onMouseEnter={()=>setHoveredIcon('react')} onMouseLeave={()=>setHoveredIcon(null)} className={`cursor-pointer ${hoveredIcon == 'react' ? 'bg-gray-700' : 'bg-base-100'} rounded-md p-1`}><ReactIcon iconColor='#fff'/></button>
                {userId == msg.senderId && <button onClick={()=>handleEdit(msg)} onMouseEnter={()=>setHoveredIcon('edit')} onMouseLeave={()=>setHoveredIcon(null)} className={`cursor-pointer ${hoveredIcon == 'edit' ? 'bg-gray-700' : 'bg-base-100'} rounded-md p-1`}><EditIcon iconColor='#fff'/></button>}
                <button onClick={()=>handleReply(msg)} onMouseEnter={()=>setHoveredIcon('reply')} onMouseLeave={()=>setHoveredIcon(null)} className={`cursor-pointer ${hoveredIcon == 'reply' ? 'bg-gray-700' : 'bg-base-100'} rounded-md p-1`}><ReplyIcon iconColor='#fff'/></button>
                {userId == msg.senderId && <button onClick={()=>handleDeleteConfirmation(msg)} onMouseEnter={()=>setHoveredIcon('delete')} onMouseLeave={()=>setHoveredIcon(null)} className={`cursor-pointer ${hoveredIcon == 'delete' ? 'bg-red-800' : 'bg-base-100'} rounded-md p-1`}><DeleteIcon iconColor='#D0021B'/></button>}
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
          type: data.type,
          isEdited: data.isEdited,
          isReply: data.isReply,
          replyId: data.replyId
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
        {replyMessage && 
          <div
            className={`text-sm flex justify-between ${replyUsername ? 'opacity-100' : 'opacity-0'}`}
          >
            Replying to {replyUsername}<button onClick={()=>setReplyMessage(null)}>X</button>
          </div>}
        <input placeholder={'Type a message...'} value={inputMessage} onChange={(e)=>setInputMessage(e.target.value)} type="text" className="input input-md items-end w-full focus:outline-0 mt-2" ref={inputRef}/>
      </form>
      <dialog id="delete_confirmation_modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <div className='absolute bottom-2 right-4'>
              <button className="btn btn-sm bg-gray-500 mr-2 hover:!border-gray-500 hover:bg-gray-600" onClick={()=>setDeleteMessage(null)}>Cancel</button>
              <button className="btn btn-sm bg-red-500 hover:!border-red-500 hover:bg-red-600" onClick={()=>sendDelete(deleteMessage!.id)}>Delete</button>
            </div>
          </form>
          <h3 className="font-bold text-lg">Delete Message</h3>
          <h3 className="text-md">Are you sure you want to delete this message?</h3>
          <div className='chat chat-end bg-base-100 p-2 m-6 rounded-md'>
              <div className="chat-header">
                {deleteMessage?.username}
                <time className="text-xs opacity-50 ml-2">{deleteMessage?.messageTime}</time>
              </div>
              <div className={`chat-bubble mt-3`}>
                {deleteMessage?.text}
                {deleteMessage?.isEdited && <span className='absolute bottom-0 right-full px-2 text-xs text-gray-300'>(edited)</span>}
              </div>
          </div>
        </div>
      </dialog>
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
