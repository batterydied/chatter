import { Navigate, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchUserFromDB } from './homePageHelpers'
import type { AppUser, Conversation, FriendRequest, HeaderData } from './homePageHelpers'
import NewUserModal from './components/NewUserPage'
import FriendList from './components/FriendList'
import ConversationWindow from './components/ConversationWindow'
import { CheckIcon, UserIcon, XIcon } from '../../assets/icons'
import { collection, DocumentSnapshot, getDoc, onSnapshot, query, where, doc, getDocs, writeBatch, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { CellMeasurer, CellMeasurerCache, List, type ListRowRenderer } from 'react-virtualized'
import axios from 'axios'
import { toast } from 'sonner'
import Loading from './components/Loading'
import RequestModal from './components/RequestModal'
import DynamicVList from './components/DynamicVList.tsx'
import SettingModal from './components/SettingModal'
import FriendRequestBtn from './components/FriendRequestBtn'
import { toDateSafe } from '../../utils/toDateSafe'
import ProfilePanel from './components/ProfilePanel'
import { HomePageContext } from '../../hooks/useHomePageContext'
import { useAppContext } from '../../hooks/useAppContext'
import { getPfpByFilePath } from '../../utils/getPfp'
import { HeaderContext } from '../../hooks/useHeaderContext.ts'
import CloseButton from './components/CloseButton.tsx'

const HomePage = () => {
    const {user, logOut} = useAppContext()
    const [isNewUser, setIsNewUser] = useState<boolean | null>(null)
    const [appUser, setAppUser] = useState<AppUser | null>(null)
    const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [settingModalOpen, setSettingModalOpen] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [unreadRequest, setUnreadRequest] = useState(0)
    const requestCacheRef = useRef(new CellMeasurerCache({fixedWidth: true, defaultHeight: 100}))
    const requestListRef = useRef<List>(null)
    const [displayInfoRecord, setDisplayInfoRecord] = useState<Record<string, HeaderData>>({})


    const conversationCacheRef = useRef(new CellMeasurerCache({fixedWidth: true, defaultHeight: 100}))
    const conversationListRef = useRef<List>(null)

    const unSubscriptionRef = useRef<(()=>void)[]>([])

    const navigate = useNavigate();

    const visibleConversations = useMemo(()=>{
        if(!appUser) return []
        return recentConversations.filter((c)=>!c.hiddenBy.includes(appUser.id))
    }, [recentConversations, appUser])
    
    useEffect(()=>{
        if(!user) {
            navigate("/", { replace: true });
            return;
        }
        for(const unsub of unSubscriptionRef.current) unsub()
        unSubscriptionRef.current = []

        if(user.email){
            fetchUserFromDB(user.email, setIsNewUser, setAppUser, setLoading)
        }
    }, [user, navigate])

    useEffect(()=>{
        if(!appUser?.id) return
        const appUserRef = doc(db, 'users', appUser.id)
        const unsub = onSnapshot(appUserRef, (snapshot) => {
            if(!snapshot.exists()) return
            const data = snapshot.data()
            setAppUser(prev => {
                if(!prev) return prev
                return {...prev, theme: data.theme, username: data.username, pfpFilePath: data.pfpFilePath, lastSeenRequest: data.lastSeenRequest || new Date()}})
        })
        return unsub
    }, [appUser?.id])

    useEffect(()=>{
        if(!appUser) return 
        const count = friendRequests.reduce((acc, req)=> toDateSafe(req.createdAt) > toDateSafe(appUser.lastSeenRequest) ?  acc + 1 : acc
        , 0)
        setUnreadRequest(count)
        const root = document.documentElement
        root.setAttribute('data-theme', appUser.theme || 'dim')
    }, [appUser, friendRequests])

    useEffect(()=>{
        if(!appUser?.id) return 
        for(const conversation of recentConversations){
            if(displayInfoRecord[conversation.id]) continue
            if(conversation.directConversationId){
                const recipientId = conversation.participants.filter((p) => p != appUser.id)[0]
                const userRef = doc(db, 'users', recipientId)
                
                const unsub = onSnapshot(userRef, (snapshot) => {
                    let displayInfo = {
                        displayName: 'Deleted User',
                        displayPfpFilePath: '',
                        displayIsOnline: false
                    }
                    if(snapshot.exists()){
                        const data = snapshot.data()
                         displayInfo = {
                            displayName: data.username,
                            displayPfpFilePath: data.pfpFilePath,
                            displayIsOnline: data.isOnline
                        }
                    }
                    setDisplayInfoRecord(prev => ({...prev, [conversation.id]: displayInfo}))
                    conversationCacheRef.current.clearAll()
                    conversationListRef.current?.recomputeRowHeights()
                })

                unSubscriptionRef.current.push(unsub)

            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recentConversations, appUser?.id])

    const handleSetFriendRequests = useCallback(async (docs: DocumentSnapshot[]) => {
        const results = await Promise.all(
            docs.map(async (reqDoc) => {
                const data = reqDoc.data() as FriendRequest | undefined;
                if (!data) return null;

                const docRef = doc(db, "users", data.from);
                const userSnapshot = await getDoc(docRef);
                if (!userSnapshot.exists()) return null;

                const userData = userSnapshot.data();
                return {
                    requestId: reqDoc.id,
                    from: data.from,
                    username: userData.username,
                    pfpFilePath: userData.pfpFilePath,
                    createdAt: data.createdAt
                };
            })
        );
        const filtered = results.filter((r) => r !== null)
        setFriendRequests(filtered)
    }, [])

    const handleDecline = useCallback(async (requestId: string) => {
        try{
            await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/relation/decline/${requestId}`)
            setFriendRequests((prev)=>prev.filter((r) => r.requestId != requestId))
        }catch{
            toast.error("Couldn't decline request, try again later.")
        }
    }, [])

    const handleAccept = useCallback(async (requestId: string) => {
        try{
            await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/relation/confirm/${requestId}`)
            setFriendRequests((prev)=>prev.filter((r) => r.requestId != requestId))
        }catch{
            toast.error("Couldn't accept request, try again later.")
        }
    }, [])

    useEffect(()=>{
        if(!appUser) return
        const queryRef = query(collection(db, "relations"),
        where("to", "==", appUser.id),
        where("status", "==", "pending"))

        const unsub = onSnapshot(queryRef, (snapshot)=>{
            handleSetFriendRequests(snapshot.docs)
        })

        return unsub
    }, [appUser, handleSetFriendRequests])

    useEffect(() => {
        if (!modalOpen || !appUser) return;

        const queryRef = query(
            collection(db, "relations"),
            where("to", "==", appUser.id),
            where("status", "==", "pending")
        );

        getDocs(queryRef).then(snapshot => {
            handleSetFriendRequests(snapshot.docs);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalOpen]);
    
    useEffect(() => {
        if(!appUser) return

        const convQuery = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', appUser.id),
            orderBy('lastMessageTime', 'desc')
        );

        const unsub = onSnapshot(convQuery, (snapshot)=>{
            const conversations: Conversation[] = []
            for(const doc of snapshot.docs){
                const data = doc.data()
                const conversationTemplate = {
                    id: doc.id,
                    name: data.name,
                    hiddenBy: data.hiddenBy,
                    participants: data.participants,
                    pfpFilePath: data.pfpFilePath,
                    directConversationId: data.directConversationId,
                    isOnline: false
                }
                conversations.push(conversationTemplate)
            }
            setRecentConversations(conversations)
            setLoading(false)
        })

        return unsub
        }, [appUser]);

    const handleDeclineAll = useCallback(async () => {
        if(!appUser) return
        const queryRef = query(collection(db, 'relations'), 
        where("to", "==", appUser.id),
        where("status", "==", "pending"))

        const snapshots = await getDocs(queryRef)

        if(snapshots.empty) return
        const snapshot = await getDocs(queryRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        
        await batch.commit();
    }, [appUser])

    const handleHideConversation = useCallback(async (e: React.MouseEvent, conversation: Conversation) => {
        e.stopPropagation()
        if(selectedConversation?.id == conversation.id){
            setSelectedConversation(null)
        }
        const conversationRef = doc(db, 'conversations', conversation.id)
        await updateDoc(conversationRef, {hiddenBy: [...conversation.hiddenBy, appUser!.id]})
    }, [appUser, selectedConversation?.id])

    const handleCloseRequestModal = useCallback(()=>{
        if(appUser){
            const userRef = doc(db, 'users', appUser.id)
            updateDoc(userRef, {lastSeenRequest: serverTimestamp()})
        }
        setModalOpen(false)
    }, [appUser])

    const renderConversations: ListRowRenderer = useCallback(
    ({ index, key, parent, style }) => {
        const conversation = visibleConversations[index];
        const displayInfo = displayInfoRecord[conversation.id] || null;
        const highlightConversation = selectedConversation?.id === conversation.id;

        return (
        <CellMeasurer
            key={key}
            cache={conversationCacheRef.current}
            parent={parent}
            columnIndex={0}
            rowIndex={index}
        >
            {() => (
            <div style={style}>
                <li
                className={`list-row no-list-divider cursor-pointer transition-colors hover:bg-neutral 
                    flex justify-between items-center group
                    ${highlightConversation ? 'bg-base-300' : ''}`}
                onClick={() => setSelectedConversation(conversation)}
                >
                <div className="flex items-center">
                    <div
                    className={`avatar ${
                        displayInfo && (displayInfo.displayIsOnline ? 'avatar-online' : 'avatar-offline')
                    } mr-2`}
                    >
                    <div className="w-10 rounded-full">
                        <img
                        src={getPfpByFilePath(
                            displayInfo ? displayInfo.displayPfpFilePath : conversation.pfpFilePath
                        )}
                        />
                    </div>
                    </div>
                    <div className='group-hover:text-neutral-content'>{displayInfo ? displayInfo.displayName : conversation.name}</div>
                </div>
                <div onClick={(e) => handleHideConversation(e, conversation)}>
                    <CloseButton className='hidden group-hover:block' />
                </div>
                </li>
            </div>
            )}
        </CellMeasurer>
        );
    },
    [displayInfoRecord, handleHideConversation, selectedConversation?.id, visibleConversations]
    );

    const renderRequests: ListRowRenderer= useCallback(({ index, key, parent, style }) => {
        const request = friendRequests[index]
        return (
            <CellMeasurer
              key={key}
              cache={requestCacheRef.current}
              parent={parent}
              columnIndex={0}
              rowIndex={index}
            >
                {()=>{
                    return (
                        <div style={style}>
                            <div className='p-1 hover:bg-base-200 flex justify-between'>
                                <div className='flex flex-row items-center'>
                                    <div className='avatar mr-2'>
                                        <div className='h-10 rounded-full'>
                                            <img src={getPfpByFilePath(request.pfpFilePath)}/>
                                        </div>
                                    </div>
                                    <div className='flex flex-col items-start justify-center'>
                                        <div>
                                            {request.username}
                                        </div>
                                        <div className='text-xs'>
                                            {request.from}
                                        </div>
                                    </div>
                                </div>
                                <div className='flex items-center'>
                                    <div onClick={()=>handleAccept(request.requestId)}className='group w-[30px] h-[30px] rounded-full mr-3 hover:outline-1 hover:outline-accent hover:cursor-pointer flex justify-center items-center'>
                                        <CheckIcon className='text-gray-400 group-hover:text-red-500'/>
                                    </div>
                                    <div onClick={()=>handleDecline(request.requestId)} className='group w-[30px] h-[30px] rounded-full hover:outline-1 hover:outline-accent hover:cursor-pointer flex justify-center items-center'>
                                        <XIcon className='text-gray-400 group-hover:text-green-500' />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }}
            </CellMeasurer>
        )

    }, [friendRequests, handleAccept, handleDecline])


    const handleOpenRequest = useCallback(() => {
        setModalOpen(true)
    }, [])

    const handleOpenSetting = useCallback(() => {
        setSettingModalOpen(true)
    }, [])

    

    const handleClearSelectConversation = useCallback(() => {
        setSelectedConversation(null)
    }, [])

    if(loading) return <Loading />

    return (
        <div className='p-2 w-screen h-screen flex'>
            {user && user.email ? (
                isNewUser ? (
                    <NewUserModal setIsNewUser={setIsNewUser} email={user.email} setAppUser={setAppUser} user={user}/>
                ) : (appUser &&
                        <HomePageContext.Provider value={appUser}>
                            <div className='flex-shrink-0 w-[360px]'>
                                <ul className='list h-5/6 overflow-y-auto overflow-x-hidden'>
                                    <li>
                                        <button className='group btn justify-start w-full border-0 shadow-none bg-base-100 hover:bg-base-300 hover:text-accent' onClick={handleClearSelectConversation}>
                                            <UserIcon className='group-hover:text-accent' />
                                            Friends
                                        </button>
                                    </li>
                                    <li>
                                        <FriendRequestBtn onClick={handleOpenRequest} count={modalOpen ? 0 : unreadRequest} />
                                    </li>
                                    <div className='border-b border-gray-700 pb-2' />
                                    <div className='my-1 flex justify-start text-sm'>
                                        Direct Messages
                                    </div>
                                    <DynamicVList cacheRef={conversationCacheRef} listRef={conversationListRef} renderer={renderConversations} data={visibleConversations} className='overflow-x-hidden'/> 
                                </ul>
                                <div className='flex items-end h-1/6 w-full'>
                                    <ProfilePanel appUser={appUser} handleOpenSetting={handleOpenSetting} />
                                </div>
                            </div>
                            <div className='w-[calc(100%-360px)] ml-2 p-2 bg-base-300'>
                                {selectedConversation ? 
                                <HeaderContext.Provider value={displayInfoRecord[selectedConversation.id] || null}>
                                    <ConversationWindow conversation={selectedConversation} />
                                </HeaderContext.Provider>
                                : 
                                <FriendList setSelectedConversation={setSelectedConversation}/>
                                }
                            </div>
                            <RequestModal isOpen={modalOpen} cacheRef={requestCacheRef} listRef={requestListRef} renderer={renderRequests} data={friendRequests} onClose={handleCloseRequestModal} handleDeclineAll={handleDeclineAll}/>
                            <SettingModal isOpen={settingModalOpen} onClose={()=>setSettingModalOpen(false)} logOut={logOut}/>
                        </HomePageContext.Provider>
                    )
                ) : (
                <Navigate to='/' />
                )}
        </div>
    )
}

export default HomePage