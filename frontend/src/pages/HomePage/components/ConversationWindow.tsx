import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { db } from '../../../config/firebase'
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { Firestore, Timestamp } from 'firebase/firestore'
import { EditIcon, SmileIcon, ReplyIcon, DeleteIcon } from '../../../assets/icons'
import { toast } from 'sonner'
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized'
import type { ListRowRenderer } from 'react-virtualized'
import forceRemeasure from '../../../utils/forceRemeasure'
import type { Conversation } from '../homePageHelpers'
import EmojiPicker from 'emoji-picker-react'
import { Theme } from 'emoji-picker-react'
import { Reactions } from './conversationWindowHelper'

type ConversationWindowProps = {
  conversation: Conversation,
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
  reactions: {
    user: string
    emoji: string,
  }[]
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
  replyId: string,
  reactions: {
    user: string
    emoji: string,
  }[]
}

const ConversationWindow = ({ conversation, userId }: ConversationWindowProps) => {
  const [messages, setMessages] = useState<SerializedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [earliestMessageId, setEarliestMessageId] = useState<string | null>(null)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<SerializedMessage | null>(null)
  const [editMessage, setEditMessage] = useState<SerializedMessage | null>(null)
  const [editMessageInputMessage, setEditMessageInputMessage] = useState('')
  const [replyMessage, setReplyMessage] = useState<SerializedMessage | null>(null)
  const [replyUsername, setReplyUsername] = useState<string | null>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)
  const [initialScrollDone, setInitialScrollDone] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(false)
  const [shouldOpenPicker, setShouldOpenPicker] = useState(false)
  const [isReactSelected, setIsReactSelected] = useState(false)

  const subscriptionDict = useRef<Record<string, ()=>void>>({})

  const cellMeasurerCache = useRef(new CellMeasurerCache({fixedWidth: true, defaultHeight: 100}))

  const textareaElRef = useRef<HTMLTextAreaElement | null>(null)
  const listRef = useRef<List>(null)
  const measureRef = useRef<(() => void) | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const pickerIconRef = useRef<HTMLDivElement>(null)

  const textareaRef = useCallback((ele: HTMLTextAreaElement | null) => {
    if(ele){
      textareaElRef.current = ele;
      const len = ele.value.length
      ele.setSelectionRange(len, len)
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
          replyId: m.replyId,
          reactions: m.reactions
        };
      })
    );
  }

  const fetchMessages = useCallback(async (size: number, prevMessageId: string | null) => {
    const params = {size, prevMessageId}
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversation.id}/message/page`,
        {params}
      )

      const rawMessages: RawMessage[] = res.data.messages
      setHasMore(!res.data.noMore)

      const serialized = await serializeMessages(rawMessages, db)

      return serialized
    } catch (e) {
      console.error('fetchMessages error', e)
      return []
    }
  }, [conversation])

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
    if(inputMessage){
      uploadMessage(conversation.id, userId, inputMessage, replyMessage != null, replyMessage?.id || '')
      setInputMessage('')
    }
  }

  const handleDeleteConfirmation = (msg: SerializedMessage) => {
    setDeleteMessage(msg);
    (document.getElementById('delete_confirmation_modal') as HTMLDialogElement)!.showModal();
  }

  const sendDelete = async (msgId: string) => {
    try{
      await axios.delete(`${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversation.id}/message/${msgId}`)
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
      setDeleteMessage(null)
      forceRemeasure(cellMeasurerCache, listRef)
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
    forceRemeasure(cellMeasurerCache, listRef)
  }

  const handleReply = (msg: SerializedMessage) => {
    setReplyMessage(msg)
    textareaElRef.current?.focus();
  }

  const handleUpdate = useCallback(async (msg: SerializedMessage, updatedMsg: string) => {
    const sendUpdate = async (msgId: string, updatedMsg: string) => {
      try{
        await axios.put(`${import.meta.env.VITE_BACKEND_API_URL}/conversation/${conversation.id}/message/${msgId}`, 
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
      await sendUpdate(msg.id, updatedMsg)
    }

    setEditMessage(null)

    forceRemeasure(cellMeasurerCache, listRef)
  }, [conversation.id])

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
  }, [editMessage, editMessageInputMessage, handleUpdate]);

  useEffect(() => {
    const onResize = ()=> {
      cellMeasurerCache.current.clearAll()
      listRef.current?.recomputeRowHeights()
      listRef.current?.forceUpdateGrid()
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

const handleScroll = useCallback(
  async ({scrollTop, clientHeight, scrollHeight}:{scrollTop: number, clientHeight: number, scrollHeight: number}) => {
    if (!initialScrollDone || !listRef.current || loadingMore || !hasMore) return;
    
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const threshold = 75;
    setIsNearBottom(distanceFromBottom < threshold);

    if (scrollTop < 150) {
      setLoadingMore(true);
      const list = listRef.current
      const moreMessages = await fetchMessages(15, earliestMessageId);
      if(!moreMessages) return 
      const newEarliestId = moreMessages.length > 0 ? moreMessages[0].id : earliestMessageId;
      const newMessages = [...moreMessages, ...messages];

      const addedHeight = moreMessages.reduce((sum, _, i) => {
        return sum + cellMeasurerCache.current.rowHeight({ index: i })
      }, 0);

      setMessages(newMessages);
      setEarliestMessageId(newEarliestId);
      cellMeasurerCache.current.clearAll();

      requestAnimationFrame(() => {
        list.recomputeRowHeights();
        requestAnimationFrame(() => {
          listRef.current?.scrollToPosition(scrollTop + addedHeight);
          setLoadingMore(false);
        });
      });
    }
  },
  [fetchMessages, hasMore, loadingMore, earliestMessageId, initialScrollDone, messages]
);

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
      cache={cellMeasurerCache.current}
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
                  <span className="text-xl">{msg.senderId.slice(0, 2)}</span>
                </div>
              </div>
              {!isGrouped && (
                <div className="chat-header">
                  <p>{msg.username}</p>
                  <time className="text-xs opacity-50 ml-2">{msg.messageTime}</time>
                </div>
              )}
              <Reactions appUserId={userId} reactions={msg.reactions}/>

              <div className={`chat-bubble bg-base-100 ${isGrouped ? 'mt-1' : 'mt-3'}`}>
                <div className="border-l-2 border-l-accent px-2 flex-col text-sm">
                  {repliedMessageId === '' ? null : repliedMessage ? (
                    <>
                      <div className="flex justify-start text-gray-400">
                        Replying to {repliedMessage.username}
                      </div>
                      <div className="flex justify-start">{repliedMessage.text}</div>
                    </>
                  ) : (
                    <div className="flex justify-start text-gray-400 italic">Original message was deleted</div>
                  )}
                </div>
      
                {isEditingMessage ? (
                  <div>
                    <textarea
                      id='edit-message'
                      ref={textareaRef}
                      onChange={(e) => {
                        setEditMessageInputMessage(e.target.value)
                      }}
                      className="textarea w-full focus:outline-none border-0 focus:shadow-none shadow-none resize-none"
                      value={editMessageInputMessage}
                    />
                    <p className="text-sm">
                      Escape to <span className="text-accent">cancel</span>, enter to{' '}
                      <span className="text-accent">save</span>
                    </p>
                  </div>
                ) : (
                  <div className="break-words whitespace-normal">
                    {msg.text}
                  </div>
                )}
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
                <button
                  onMouseEnter={() => setHoveredIcon('react')}
                  onMouseLeave={() => setHoveredIcon(null)}
                  onClick={()=>setIsReactSelected(true)}
                  className={`cursor-pointer ${
                    hoveredIcon == 'react' ? 'bg-gray-700' : 'bg-base-100'
                  } rounded-md p-1`}
                >
                  <SmileIcon iconColor='white' />
                </button>
                {userId == msg.senderId && (
                  <button
                    onClick={() => {
                      handleEdit(msg)
                      forceRemeasure(cellMeasurerCache, listRef)
                    }}
                    onMouseEnter={() => setHoveredIcon('edit')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    className={`cursor-pointer ${
                      hoveredIcon == 'edit' ? 'bg-gray-700' : 'bg-base-100'
                    } rounded-md p-1`}
                  >
                    <EditIcon iconColor='white' />
                  </button>
                )}
                <button
                  onClick={() => handleReply(msg)}
                  onMouseEnter={() => setHoveredIcon('reply')}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className={`cursor-pointer ${
                    hoveredIcon == 'reply' ? 'bg-gray-700' : 'bg-base-100'
                  } rounded-md p-1`}
                >
                  <ReplyIcon iconColor='white' />
                </button>
                {userId == msg.senderId && (
                  <button
                    onClick={() => handleDeleteConfirmation(msg)}
                    onMouseEnter={() => setHoveredIcon('delete')}
                    onMouseLeave={() => setHoveredIcon(null)}
                    className={`cursor-pointer ${
                      hoveredIcon == 'delete' ? 'bg-gray-700' : 'bg-base-100'
                    } rounded-md p-1`}
                  >
                    <DeleteIcon iconColor="#D0021B" />
                  </button>
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
      setLoading(true)
      setMessages([])
      const initialMessages = await fetchMessages(15, null)
      if(initialMessages.length != 0){
        setEarliestMessageId(initialMessages[0].id)
        setMessages(initialMessages)
      }
      requestAnimationFrame(() => {
        setShouldScrollToBottom(true)
        setLoading(false)
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
      if(msg.senderId === userId || msg.id in subscriptionDict.current){
        return
      }
      const msgRef = doc(db, 'conversations', conversation.id, 'messages', msg.id);

      const unsub = onSnapshot(msgRef, async (snapshot) => {
        if (!snapshot.exists()){ 
          setMessages((prev)=>prev.filter((m)=>m.id !== msg.id))
          forceRemeasure(cellMeasurerCache, listRef)
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
          reactions: data.reactions
        }], db);

        subscriptionDict.current[msg.id] = unsub
        let updated = false
        setMessages((prev) => {
          const newMessages = prev.map((m) => {
            if (m.id !== serialized.id) return m;

            // Only update if text or isEdited (or other fields you care about) changed
            if (
              m.text !== serialized.text ||
              m.isEdited !== serialized.isEdited ||
              m.senderId !== serialized.senderId || // if needed
              m.replyId !== serialized.replyId
              // add more fields to compare if relevant
            ) {
              updated = true;
              return serialized;
            }
            return m;
          });
          return newMessages
        });

        if(updated) forceRemeasure(cellMeasurerCache, listRef)
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
          reactions: data.reactions
        };
      });

      const serializedMessages = await serializeMessages(rawMessages, db);
      
      setMessages((prev) => {
        const newMessage = serializedMessages[0];
        if (!newMessage) return prev;
        
        const exists = prev.some((m) => m.id === newMessage.id);
        if (exists) return prev;

        if (newMessage.senderId === userId || isNearBottom) {
          setShouldScrollToBottom(true);
        }

        return [...prev, newMessage];
      });
    });
    
    return unsub;
  }, [conversation, userId, isNearBottom]);

  const handlePicker = () => {
    setShouldOpenPicker((prev)=> !prev)
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
        console.log(e.message)
      }else{
        console.log('Unknown error occurred')
      }
    }
  }

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
    <div className='h-full w-full flex flex-col relative'>
        {isReactSelected && 
            <div className="absolute inset-0 z-[99999] flex items-center justify-center" onClick={()=>setIsReactSelected(false)}>
                <div onClick={(e)=>e.stopPropagation()}>
                  <EmojiPicker />
                </div>
            </div>
        }
        <div className='border-b-1 border-gray-700 flex justify-start items-center p-2'>
          <div className="avatar">
            <div className="w-6 rounded-full">
              <img src="https://img.daisyui.com/images/profile/demo/gordon@192.webp" />
            </div>
          </div>
          <div className='ml-2 text-white'>{conversation.name}</div>
        </div>
        {loadingMore && <span className="loading loading-dots loading-md self-center"></span>}
        <div className='w-full h-screen relative'>
          <AutoSizer>
            {({width, height})=>
              <List
                width={width}
                height={height}
                rowHeight={cellMeasurerCache.current.rowHeight}
                deferredMeasurementCache={cellMeasurerCache.current}
                rowCount={messages.length}
                rowRenderer={renderMessages}
                scrollToIndex={shouldScrollToBottom ? messages.length - 1 : undefined}
                onScroll={handleScroll}
                ref={listRef}
                className='mt-2'
              />
            }
          </AutoSizer> 
        </div>
      <div>
        {replyMessage && 
          <div
            className={`text-sm flex justify-between ${replyUsername ? 'opacity-100' : 'opacity-0'}`}
          >
            Replying to {replyUsername}<button onClick={()=>setReplyMessage(null)}>X</button>
          </div>}
        <div className='relative'>
          <div className="absolute right-0 bottom-full" ref={pickerRef}>
            <EmojiPicker 
            onEmojiClick={(emojiObj)=>{
              setInputMessage((prev)=>prev + emojiObj.emoji)
              textareaElRef.current?.focus();
            }} 
            theme={'dark' as Theme}
            lazyLoadEmojis={true}
            open={shouldOpenPicker}
            />
          </div>
          <div className='border-1 rounded-md border-base-100 flex w-full justify-between items-center p-2'>
            <textarea
              id="chat-message"
              rows={1}
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
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
            <div className='hover:bg-base-100 p-1 rounded-md' ref={pickerIconRef}>
              <SmileIcon onClick={handlePicker} className='hover:cursor-pointer hover:accent' iconColor={shouldOpenPicker ? 'white' : 'gray'} />
            </div>
          </div>
        </div>

      </div>
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


export default ConversationWindow
