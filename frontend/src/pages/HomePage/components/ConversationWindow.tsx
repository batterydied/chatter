import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { db } from '../../../config/firebase'
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { EditIcon, SmileIcon, ReplyIcon, DeleteIcon, XIcon } from '../../../assets/icons'
import { toast } from 'sonner'
import { CellMeasurer, CellMeasurerCache, List } from 'react-virtualized'
import type { ListRowRenderer } from 'react-virtualized'
import { getPfpByFilePath, type Conversation } from '../homePageHelpers'
import EmojiPicker from 'emoji-picker-react'
import { Theme } from 'emoji-picker-react'
import { supabase } from '../../../config/supabase'
import Loading from './Loading'
import DeleteMessageModal from './DeleteMessageModal'
import { Reactions, type Reaction } from './Reactions'
import VList from './VList'
import serializeMessages from '../../../utils/serializeMessages'

type ConversationWindowProps = {
  conversation: Conversation,
  userId: string,
}

export type RawMessage = {
  id: string,
  createdAt: string | Timestamp, //if you get it from backend api, it's a string; if you use firebase snapshot, it's a timestamp
  senderId: string,
  text: string,
  type: string,
  isEdited: boolean,
  isReply: boolean,
  replyId: string,
  reactions: {
    user: string,
    emoji: string
  }[]
}

export type SerializedMessage = {
  id: string
  text: string
  messageTime: string,
  senderId: string,
  timestamp: Date,
  isEdited: boolean,
  isReply: boolean,
  replyId: string,
  reactions: {
    user: string
    emoji: string,
  }[],
}
const ConversationWindow = ({ conversation, userId }: ConversationWindowProps) => {
  const [messages, setMessages] = useState<SerializedMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [earliestMessageId, setEarliestMessageId] = useState<string | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<SerializedMessage | null>(null)
  const [editMessage, setEditMessage] = useState<SerializedMessage | null>(null)
  const [editMessageInputMessage, setEditMessageInputMessage] = useState('')
  const [replyMessage, setReplyMessage] = useState<SerializedMessage | null>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)
  const [initialScrollDone, setInitialScrollDone] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(false)
  const [shouldOpenPicker, setShouldOpenPicker] = useState(false)
  const [isReactSelected, setIsReactSelected] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState('')
  const [shouldRecomputeAllRows, setShouldRecomputeAllRows] = useState(false)

  const [usernameRecord, setUsernameRecord] = useState<Record<string, string>>({})
  const [pfpRecord, setPfpRecord] = useState<Record<string, string>>({})

  const subscriptionDict = useRef<Record<string, ()=>void>>({})

  const cacheRef = useRef(new CellMeasurerCache({fixedWidth: true, defaultHeight: 100}))

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const editTextareRef = useRef<HTMLTextAreaElement | null>(null)
  const listRef = useRef<List>(null)
  const measureRef = useRef<(() => void) | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const pickerIconRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async (size: number, prevMessageId: string | null) => {
    const params = {size, prevMessageId}
    cacheRef.current.clearAll()
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversation.id}/message/page`,
        {params}
      )

      const rawMessages: RawMessage[] = res.data.messages
      setHasMore(!res.data.noMore)

      const serialized = await serializeMessages(rawMessages)

      return serialized
    } catch (e) {
      console.error('fetchMessages error', e)
      return []
    }
  }, [conversation])

  useEffect(() => {
    const unsubscribers: (() => void)[] = []

    conversation.participants.forEach(participantId => {
      const userRef = doc(db, 'users', participantId)
      const unsubscribe = onSnapshot(userRef, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          setPfpRecord(prev => ({
            ...prev,
            [participantId]: data.pfpFilePath
          }))
          setUsernameRecord(prev => ({
            ...prev,
            [participantId]: data.username 
          }))
        }else{
          setPfpRecord(prev => ({
            ...prev,
            [participantId]: 'default/default_user.png'
          }))
          setUsernameRecord(prev => ({
            ...prev,
            [participantId]: 'Deleted User'
          }))
        }
      })
      unsubscribers.push(unsubscribe)
    })
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [conversation, userId])

  useEffect(()=>{
    for (const key in subscriptionDict.current) {
      {
        subscriptionDict.current[key]()
      }
    }
    subscriptionDict.current = {}
  }, [conversation])

  const handleSelectHoverId = (msgId: string)=>{
    setHoveredMessageId(msgId)
  }

  const handleRemoveHoverId = () => {
    setHoveredMessageId(null)
  }
  
  const handleSubmit = () => {
    if(newMessage){
      uploadMessage(conversation.id, userId, newMessage, replyMessage != null, replyMessage?.id || '')
      setNewMessage('')
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  const handleDeleteConfirmation = (msg: SerializedMessage) => {
    setDeleteMessage(msg);
    (document.getElementById('delete_confirmation_modal') as HTMLDialogElement)!.showModal();
  }

  const sendDelete = async (msgId: string) => {
    try{
      await axios.delete(`${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversation.id}/message/${msgId}`)
      let clearAllBelow = false
      setMessages(prev => prev.filter((m, idx) => {
        if(m.id == msgId) clearAllBelow = true; 
        
        if(clearAllBelow) cacheRef.current.clear(idx, 0)
        return m.id !== msgId
      }))
      setDeleteMessage(null)
      listRef.current?.recomputeRowHeights(); 
    }catch{
      toast.error('Could not delete message, try again later.')
    }
  }

  const handleEdit = (msg: SerializedMessage, index: number) => {
    if(editMessage){
      cancelEdit()
    }
    cacheRef.current.clear(index, 0)
    setEditMessage(msg)
    setEditMessageInputMessage(msg.text)
    listRef.current?.recomputeRowHeights(index)
  }
  
  const cancelEdit = useCallback(() => {
    const idx = messages.findIndex((m)=> m.id == editMessage?.id)
    setEditMessage(null)
    if(idx >= 0) cacheRef.current.clear(idx, 0); listRef.current?.recomputeRowHeights(idx)
  }, [editMessage?.id, messages])

  const handleReply = (msg: SerializedMessage) => {
    setReplyMessage(msg)
    textareaRef.current?.focus();
  }

  const handleUpdate = useCallback(async (msg: SerializedMessage, updatedMsg: string) => {
    const sendUpdate = async (msgId: string, updatedMsg: string) => {
      try{
        await axios.put(`${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversation.id}/message/${msgId}`, 
          {
            type: 'text',
            text: updatedMsg
          })
        setMessages(prevMessages =>
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
      await sendUpdate(msg.id, updatedMsg)
    }

    cancelEdit()
    
  }, [cancelEdit, conversation.id])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelEdit()
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMessage, editMessageInputMessage, handleUpdate]);

  useEffect(() => {
    let last = 0
    const onResize = () => {
      const now = Date.now()
      if (now - last > 150) {
        cacheRef.current.clearAll()
        listRef.current?.recomputeRowHeights()
        listRef.current?.forceUpdateGrid()
        last = now
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleIncrement = (emoji: string, msgId: string) => {
    let updatedReactions: Reaction[] = []
    const updatedMessages = messages.map((m)=>{
      if(m.id == msgId){
        updatedReactions = [...m.reactions, {user: userId, emoji }]
        return {...m, reactions: updatedReactions}
      }
      return m
    })
    setMessages(updatedMessages)
    const msgRef = doc(db, 'conversations', conversation.id, 'messages', msgId)
    updateDoc(msgRef, {reactions: updatedReactions})

    const idx = messages.findIndex((m) => m.id == msgId)
    if(idx >=0 ) cacheRef.current.clear(idx, 0); listRef.current?.recomputeRowHeights(idx)
  }

  const handleDecrement = (emoji: string, msgId: string) => {
    let updatedReactions: Reaction[] = []
    const updatedMessages = messages.map((m)=>{
      if(m.id == msgId){
        updatedReactions = [...m.reactions.filter((x)=> x.emoji != emoji || x.user != userId)]
        return {...m, reactions: updatedReactions}
      }
      return m
    })
    setMessages(updatedMessages)
    const msgRef = doc(db, 'conversations', conversation.id, 'messages', msgId)
    updateDoc(msgRef, {reactions: updatedReactions})

    const idx = messages.findIndex((m) => m.id == msgId)
    if(idx >=0 ) cacheRef.current.clear(idx, 0); listRef.current?.recomputeRowHeights(idx)
  }

  const handleReact = (emoji: string) => {
    handleIncrement(emoji, selectedMessageId)
    setSelectedMessageId('')
    setIsReactSelected(false)
  }

  const handleScroll = useCallback(
  async ({
    scrollTop,
    clientHeight,
    scrollHeight,
  }: {
    scrollTop: number;
    clientHeight: number;
    scrollHeight: number;
  }) => {
    if (!initialScrollDone || !listRef.current || loadingMore || !hasMore) return;
    // Track near-bottom for auto-scroll on new messages
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const threshold = 75;
    setIsNearBottom(distanceFromBottom < threshold);

    // If we're near the top, load older messages
    if (scrollTop < 10) {
      setLoadingMore(true);

      // Fetch older messages
      const moreMessages = await fetchMessages(15, earliestMessageId);
      if (!moreMessages?.length) {
        setLoadingMore(false);
        return;
      }

      // Prepend older messages
      const newMessages = [...moreMessages, ...messages];
      setMessages(newMessages);

      // Update earliest message ID
      const newEarliestId = newMessages[0].id;
      setEarliestMessageId(newEarliestId);

      setShouldRecomputeAllRows(true)

      requestAnimationFrame(()=>{listRef.current?.scrollToRow(moreMessages.length + 4)}) //unable to anchor the correct position so did some testing (it's a fudge factor)
      
      setLoadingMore(false);
    }
  },
  [initialScrollDone, loadingMore, hasMore, fetchMessages, earliestMessageId, messages]
);


  useEffect(()=>{
    if(!shouldRecomputeAllRows) return
    cacheRef.current.clearAll()
    listRef.current?.recomputeRowHeights()
    setShouldRecomputeAllRows(false)
  }, [shouldRecomputeAllRows])

  const getPfpById = (id: string) => {
    const url =  pfpRecord[id] || 'default/default_user.png'
    return supabase.storage.from('avatars').getPublicUrl(url).data.publicUrl
  }

  const getUsername = (id: string) => {
    return usernameRecord[id]
  }

  const renderMessages: ListRowRenderer = ({ index, key, parent, style }) => {
    const msg = messages[index]
    const prev = index > 0 ? messages[index - 1] : null
    const isGrouped =
      prev &&
      prev.senderId === msg.senderId &&
      Math.abs(new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime()) < 2 * 60 * 1000
    const isHovered = hoveredMessageId === msg.id
    const isUser = userId === msg.senderId
    const isEditingMessage = editMessage?.id === msg.id
    const isReply = replyMessage?.id === msg.id
    const repliedMessageId = msg.replyId
    let repliedMessage: SerializedMessage | null = null
    if (repliedMessageId !== '') {
      repliedMessage = messages.find((m) => m.id === repliedMessageId) || null
    }

    return (
      <CellMeasurer
        key={key}
        cache={cacheRef.current}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        {({measure}) => {
          measureRef.current = measure
          return (
            <div
              style={style}
              className="relative"
              onMouseLeave={() => {
                handleRemoveHoverId()
              }}
              onMouseEnter={() => {
                handleSelectHoverId(msg.id)
              }}
            >
              <div
                className={`chat rounded-md ${isUser ? 'chat-end' : 'chat-start'} ${
                  isReply && isHovered
                    ? 'bg-blue-900'
                    : isReply
                    ? 'bg-blue-950'
                    : isHovered
                    ? 'bg-base-200'
                    : 'bg-base-300'
                } relative text-left whitespace-normal`}
              >
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full bg-base-100 flex items-center justify-center">
                    <img src={getPfpById(msg.senderId)}/>
                  </div>
                </div>
                {!isGrouped && (
                  <div className="chat-header">
                    <p>{getUsername(msg.senderId)}</p>
                    <time className="text-xs opacity-50 ml-2">{msg.messageTime}</time>
                  </div>
                )}

                {isEditingMessage ? (
                    <div className='chat-bubble w-full bg-base-100'>
                      <textarea
                        id='edit-message'
                        ref={(el)=>{
                          editTextareRef.current = el
                          if(el){
                            if(textareaRef.current && document.activeElement !== textareaRef.current){
                              const len = el.value.length
                              el.setSelectionRange(len, len)
                              el?.focus({ preventScroll: true });
                            }
                          }
                        }}
                        onChange={(e) => {
                          setEditMessageInputMessage(e.target.value)
                        }}
                        className="textarea w-full focus:outline-none border-0 focus:shadow-none shadow-none resize-none"
                        value={editMessageInputMessage}
                      />
                      <p className="text-sm">
                        Escape to <span className="text-accent">cancel</span>, enter to 
                        <span className="text-accent"> save</span>
                      </p>
                    </div>):(
                    <div className={`chat-bubble bg-base-100 ${isGrouped ? 'mt-1' : 'mt-3'}`}>
                      <div className="border-l-2 border-l-accent px-2 flex-col text-sm">
                        {repliedMessageId === '' ? null : repliedMessage ? (
                          <>
                            <div className="flex justify-start text-gray-400">
                              Replying to {getUsername(repliedMessage.senderId)}
                            </div>
                            <div className="flex justify-start">{repliedMessage.text}</div>
                          </>
                        ) : (
                          <div className="flex justify-start text-gray-400 italic">Original message was deleted</div>
                        )}
                      </div>
                      <div className="break-words whitespace-normal">
                        {msg.text}
                      </div>
                    </div>)}
                <div className="chat-footer mt-1 text-lg">
                  <Reactions
                    msgId={msg.id}
                    reactions={msg.reactions}
                    appUserId={userId}
                    handleIncrement={handleIncrement}
                    handleDecrement={handleDecrement}
                  />
                </div>
              </div>

              {msg.isEdited && (
                  <span
                    className={`text-xs text-accent flex w-full ${isUser ? 'justify-end': 'justify-start'}`}
                  >
                    (edited)
                  </span>
              )}
      
              {isHovered && (
                <div className="absolute right-4 -top-2 p-2 bg-base-100 outline-1 outline-base-200 rounded-md flex items-center">
                  <SmileIcon onClick={
                    ()=>{
                      setIsReactSelected(true)
                      setSelectedMessageId(msg.id)
                    }
                  } className='text-gray-400 hover:text-white hover:cursor-pointer mx-1' />
                  {userId == msg.senderId && (
                      <EditIcon onClick={() => handleEdit(msg, index)} className='text-gray-400 hover:text-white hover:cursor-pointer mx-1' />
                  )}
                  <ReplyIcon onClick={() => handleReply(msg)} className='text-gray-400 hover:text-white hover:cursor-pointer mx-1' />
                  {userId == msg.senderId && (
                      <DeleteIcon onClick={() => handleDeleteConfirmation(msg)} className="text-red-800 hover:text-red-600 hover:cursor-pointer mx-1" />
                  )}
                </div>
              )}
            </div>
            )}}
      </CellMeasurer>
    )
  }

  useEffect(() => {
    const init = async () => {
      setLoadingMessages(true)
      setMessages([])
      const initialMessages = await fetchMessages(15, null)
      if(initialMessages.length != 0){
        setEarliestMessageId(initialMessages[0].id)
        setMessages(initialMessages)
      }
      requestAnimationFrame(() => {
        setShouldScrollToBottom(true)
        setLoadingMessages(false)
      })
    }
    init()
  }, [fetchMessages])

  useEffect(()=>{
    if(shouldScrollToBottom && messages.length > 0){
      listRef.current?.scrollToRow(messages.length - 1)
      requestAnimationFrame(() => {
        requestAnimationFrame(()=>{
          setShouldScrollToBottom(false)
          setInitialScrollDone(true)
        })
      })
    }
  }, [shouldScrollToBottom, messages])

  useEffect(() => {
    messages.forEach((msg) => {
      if(msg.id in subscriptionDict.current){
        return
      }
      const msgRef = doc(db, 'conversations', conversation.id, 'messages', msg.id);

      const unsub = onSnapshot(msgRef, async (snapshot) => {
        if (!snapshot.exists()){ 
          let idx = -1
          setMessages(prev =>prev.filter((m, currIdx)=>{
            if(m.id == msg.id) idx = currIdx
            return m.id !== msg.id
          }))
          cacheRef.current.clear(idx, 0)
          return;
        }

        const data = snapshot.data();
        const [serialized] = await serializeMessages([{
          id: snapshot.id,
          createdAt: data.createdAt,
          senderId: data.senderId,
          text: data.text,
          type: data.type,
          isEdited: data.isEdited,
          isReply: data.isReply,
          replyId: data.replyId,
          reactions: data.reactions,
        }]);

        subscriptionDict.current[msg.id] = unsub
        setMessages(prev => {
          const newMessages = prev.map((m) => {
            if (m.id !== serialized.id) return m;

            // Only update if text or isEdited (or other fields you care about) changed
            if (
              m.text !== serialized.text ||
              m.isEdited !== serialized.isEdited ||
              m.senderId !== serialized.senderId || // if needed
              m.replyId !== serialized.replyId ||
              m.reactions !== serialized.reactions
              // add more fields to compare if relevant
            ) {
              return serialized;
            }
            return m;
          });
          return newMessages
        });
      });
    });

  }, [conversation, messages, userId]);

  useEffect(()=>{
    if(!shouldOpenPicker) return
    const handleClosePicker = (e: MouseEvent) => {
       if (pickerRef.current && !pickerRef.current.contains(e.target as Node) && 
       pickerIconRef.current && !pickerIconRef.current.contains(e.target as Node)) {
        setShouldOpenPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClosePicker)

    return ()=>document.removeEventListener('mousedown', handleClosePicker)
  }, [shouldOpenPicker])

  useEffect(() => {
    if(!conversation.id) return
    const queryRef = query(
      collection(db, 'conversations', conversation.id, 'messages'),
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
          replyId: data.replyId,
          reactions: data.reactions,
        };
      });

      const serializedMessages = await serializeMessages(rawMessages);
      
      let idx = -1
      setMessages(prev => {
        const newMessage = serializedMessages[0];
        if (!newMessage) return prev;
        
        const exists = prev.some((m) => m.id === newMessage.id);
        if (exists) return prev;

        if (newMessage.senderId === userId || isNearBottom) {
          setShouldScrollToBottom(true);
        }
        idx = prev.length;
        cacheRef.current.clear(idx, 0)

        return [...prev, newMessage];
      });

      if(idx >= 0) listRef.current?.recomputeRowHeights(idx)
    });
    
    return unsub;
  }, [conversation, userId, isNearBottom]);

  const handlePicker = () => {
    setShouldOpenPicker(prev => !prev)
  }

  const uploadMessage = async (conversationId: string, userId: string, inputMessage: string, isReply: boolean, replyId: string) => {
    try{
      const message = {
        senderId: userId,
        type: 'text',
        text: inputMessage,
        isReply,
        replyId
      }
      setShouldOpenPicker(false)
      setReplyMessage(null)
      await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversationId}/message`, message)
    }catch(e){
      if(axios.isAxiosError(e)){
        console.error(e.message)
      }else{
        console.error('Unknown error occurred')
      }
    }
  }

  if(!messages) return <Loading />
    
  if(loadingMessages){
    return (
      <div className="w-full h-full flex justify-center items-center">
        <span className="loading loading-ring loading-xl"></span>
      </div>
    )
  } 
  return (
    <div className='h-full w-full flex flex-col relative'>
        {isReactSelected && 
            <div className="absolute inset-0 z-[99999] flex items-center justify-center" onClick={()=>setIsReactSelected(false)}>
                <div onClick={(e)=>e.stopPropagation()}>
                  <EmojiPicker lazyLoadEmojis={true} theme={'dark' as Theme} onEmojiClick={(e)=>handleReact(e.emoji)}/>
                </div>
            </div>
        }
        <div className='border-b-1 border-gray-700 flex justify-start items-center p-2'>
          <div className={`avatar 
            ${conversation.directConversationId && (conversation.isOnline ? 'avatar-online' : 'avatar-offline')}`}>
            <div className="w-6 rounded-full">
              <img src={getPfpByFilePath(conversation.pfpFilePath)} />
            </div>
          </div>
          <div className='ml-2 text-white'>{conversation.name}</div>
        </div>
        {loadingMore && <span className="loading loading-dots loading-md self-center"></span>}
        <div className='w-full h-screen relative'>
          <VList cacheRef={cacheRef} listRef={listRef} renderer={renderMessages} data={messages} className='mt-2' onScroll={handleScroll} scrollToIndex={shouldScrollToBottom ? messages.length: undefined} rowKey={({ index }:{index: number}) => messages[index].id}/>
        </div>
      <div>
        <div className='relative'>
          <div className="absolute right-0 bottom-full" ref={pickerRef}>
            <EmojiPicker 
            onEmojiClick={(emojiObj)=>{
              setNewMessage(prev => prev + emojiObj.emoji)
              textareaRef.current?.focus();
            }} 
            theme={'dark' as Theme}
            lazyLoadEmojis={true}
            open={shouldOpenPicker}
            />
          </div>

          <div className='mt-3'>
            {replyMessage && 
            <div
              className={`text-sm flex justify-between`}
            >
              Replying to {getUsername(replyMessage.senderId)}
              
              <XIcon className='hover:cursor-pointer text-gray-400 hover:text-white' onClick={()=>setReplyMessage(null)}/>
            </div>}
            <div className='border-1 rounded-md border-base-100 flex w-full justify-between items-center p-2'>
              <textarea
                id="chat-message"
                rows={1}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  e.currentTarget.style.height = 'auto'; // Reset height
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`; // Resize
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                ref={textareaRef}
                className="focus:outline-none textarea-md w-[90%] resize-none overflow-auto !min-h-0"
              />
              <div className='group hover:bg-base-100 p-1 rounded-md' ref={pickerIconRef}>
                <SmileIcon onClick={handlePicker} className={`hover:cursor-pointer group-hover:text-gray-400 ${shouldOpenPicker ? '!text-white' : 'text-gray-600'}`} />
              </div>
            </div>
          </div>
        </div>

      </div>
      <DeleteMessageModal deleteMessage={deleteMessage} username={getUsername(deleteMessage?.senderId || '')} setDeleteMessage={setDeleteMessage} sendDelete={sendDelete}/>
    </div>
  )
}

export default ConversationWindow
