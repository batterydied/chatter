import type { User } from 'firebase/auth'
import { Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { fetchUserFromDB, getPfpByFilePath, subscribeConversations } from './homePageHelpers'
import type { AppUser, Conversation, FriendRequest } from './homePageHelpers'
import NewUserModal from './components/NewUserPage'
import FriendList from './components/FriendList'
import ConversationWindow from './components/ConversationWindow'
import { CheckIcon, GearsIcon, RequestIcon, UserIcon, XIcon } from '../../assets/icons'
import { collection, DocumentSnapshot, getDoc, onSnapshot, query, where, doc, getDocs, writeBatch, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { CellMeasurer, CellMeasurerCache, List, type ListRowRenderer } from 'react-virtualized'
import axios from 'axios'
import { toast } from 'sonner'
import Loading from './components/Loading'
import RequestModal from './components/RequestModal'
import VList from './components/VList'
import SettingModal from './components/SettingModal'

type HomeProps = {
    user: User | null
    logOut: () => void,
}

const HomePage = ({user, logOut} : HomeProps) => {
    const [isNewUser, setIsNewUser] = useState<boolean | null>(null)
    const [appUser, setAppUser] = useState<AppUser | null>(null)
    const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
    const [visibleConversations, setVisibleConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [modalOpen, setModalOpen] = useState(false)
    const requestCacheRef = useRef(new CellMeasurerCache({fixedWidth: true, defaultHeight: 100}))
    const requestListRef = useRef<List>(null)
    const conversationRecordRef = useRef<Record<string, ()=>void>>({})

    const conversationCacheRef = useRef(new CellMeasurerCache({fixedWidth: true, defaultHeight: 100}))
    const conversationListRef = useRef<List>(null)

    const navigate = useNavigate();

    useEffect(()=>{
        setVisibleConversations(recentConversations.filter((c)=>!c.hiddenBy.includes(appUser?.id || '')))
    }, [recentConversations, appUser])

    useEffect(()=>{
        if(!user) {
            navigate("/", { replace: true });
            return;
        }
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
                return {...prev, username: data.username, pfpFilePath: data.pfpFilePath}})
        })
        return unsub
    }, [appUser?.id])

    const handleSetFriendRequests = async (docs: DocumentSnapshot[]) => {
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
                    pfpFilePath: userData.pfpFilePath
                };
            })
        );
    const filtered = results.filter((r) => r !== null)
    setFriendRequests(filtered)
};
    const handleDecline = async (requestId: string) => {
        try{
            await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/relation/decline/${requestId}`)
        }catch{
            toast.error("Couldn't decline request, try again later.")
        }
    }

    const handleAccept = async (requestId: string) => {
        try{
            await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/relation/confirm/${requestId}`)
        }catch{
            toast.error("Couldn't accept request, try again later.")
        }
    }

    useEffect(()=>{
        if(!appUser) return
        const queryRef = query(collection(db, "relations"),
        where("to", "==", appUser.id),
        where("status", "==", "pending"))

        const unsub = onSnapshot(queryRef, (snapshot)=>{
            handleSetFriendRequests(snapshot.docs)
        })

        return unsub
    }, [appUser])

    useEffect(() => {
        for(const unsub of Object.values(conversationRecordRef.current)) unsub()

        conversationRecordRef.current = {}
    }, [appUser])

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
    
    useEffect(()=>{
        if(appUser){
            const unsub = subscribeConversations(appUser.id, setRecentConversations, setLoading)
            return unsub
        }
    }, [appUser])

    const handleDeclineAll = async () => {
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
    }

    const handleHideConversation = async (e: React.MouseEvent, conversation: Conversation) => {
        e.stopPropagation()
        if(selectedConversation?.id == conversation.id){
            setSelectedConversation(null)
        }
        const conversationRef = doc(db, 'conversations', conversation.id)
        await updateDoc(conversationRef, {hiddenBy: [...conversation.hiddenBy, appUser!.id]})
    }

    const renderConversations: ListRowRenderer = ({index, key, parent, style }) => {
        const conversation = visibleConversations[index]
        const highlightConversation = selectedConversation?.id == conversation.id
        return (
            <CellMeasurer
             key={key}
             cache={conversationCacheRef.current}
             parent={parent}
             columnIndex={0}
             rowIndex={index}>
                {()=>{
                    return (
                        <div style={style}>
                            <li className={`list-row no-list-divider cursor-pointer transition-colors hover:bg-neutral 
                                flex justify-between items-center group
                                ${highlightConversation ? 'bg-base-300' : ''}`}
                            onClick={()=>{
                                setSelectedConversation(conversation)
                            }} 
                            >
                                <div className='flex items-center'>
                                    <div className={`avatar 
                                        ${conversation.directConversationId && (conversation.isOnline ? 'avatar-online' : 'avatar-offline')} 
                                    mr-2`}>
                                        <div className="w-10 rounded-full">
                                            <img src={getPfpByFilePath(conversation.pfpFilePath)} />
                                        </div>
                                    </div>
                                    <div>{conversation.name}</div>
                                </div>
                                <XIcon onClick={(e)=>handleHideConversation(e, conversation)} className='hidden group-hover:block rounded-full hover:outline-1 hover:outline-accent text-gray-400 hover:text-white'/>
                            </li>
                        </div>
                    )
                }}
            </CellMeasurer>
        )
    }
    const renderRequests: ListRowRenderer= ({ index, key, parent, style }) => {
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
                            <div className='p-2 hover:bg-base-200 flex justify-between'>
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
                                        <div onClick={()=>handleAccept(request.requestId)}className='w-[30px] h-[30px] rounded-full bg-green-600 mr-6 hover:cursor-pointer hover:bg-green-700 active:bg-green-800 flex justify-center items-center'>
                                            <div>
                                                <CheckIcon className='text-black'/>
                                            </div>
                                        </div>
                                        <div onClick={()=>handleDecline(request.requestId)} className='w-[30px] h-[30px] rounded-full bg-red-600 hover:cursor-pointer hover:bg-red-700 active:bg-red-800 flex justify-center items-center'>
                                            <div>
                                                <XIcon className='text-black' />
                                            </div>
                                        </div>
                                    </div>
                            </div>
                        </div>
                    )
                }}
            </CellMeasurer>
        )

    }

    if(loading) return <Loading />

    const handleOpenRequest = () => {
        (document.getElementById('request_modal') as HTMLDialogElement)!.showModal();
        setModalOpen(true)
    }

    const handleOpenSetting = () => {
        (document.getElementById('setting_modal') as HTMLDialogElement)!.showModal()
    }

    return (
        <div className='w-full h-full flex justify-center items-center'>
            {user && user.email ? (
                isNewUser ? (
                    <NewUserModal setIsNewUser={setIsNewUser} email={user.email} setAppUser={setAppUser} user={user}/>
                ) : (appUser &&
                        <div className='flex flex-row w-full h-full'>
                            <div className='min-w-[360px]'>
                                <ul className='list h-5/6 overflow-y-auto overflow-x-hidden'>
                                    <li>
                                        <button className='group btn justify-start w-full border-0 shadow-none bg-base-100 hover:bg-base-300 text-gray-400 hover:text-white' onClick={()=>setSelectedConversation(null)}>
                                            <UserIcon className='text-gray-400 group-hover:text-white' />
                                            Friends
                                        </button>
                                    </li>
                                    <li>
                                        <button className='group btn justify-start w-full border-0 shadow-none bg-base-100 hover:bg-base-300 text-gray-400 hover:text-white' onClick={handleOpenRequest}>
                                            <RequestIcon className='text-gray-400 group-hover:text-white'/>
                                            Requests
                                        </button>
                                    </li>
                                    <div className='border-b border-gray-700 pb-2' />
                                    <div className='my-1 flex justify-start text-gray-600 text-sm'>
                                        Direct Messages
                                    </div>
                                    <VList cacheRef={conversationCacheRef} listRef={conversationListRef} renderer={renderConversations} data={visibleConversations} className='overflow-x-hidden'/> 
                                </ul>
                                <div className='flex h-1/6 justify-between items-center bg-base-300 p-5 rounded-2xl outline-1 outline-base-100'>
                                    <div className='flex flex-row items-center'>
                                        <div className="avatar avatar-online avatar-placeholder">
                                            <div className="bg-neutral text-base-content w-16 rounded-full">
                                                <img src={getPfpByFilePath(appUser!.pfpFilePath)} />
                                            </div>
                                        </div>
                                        <div className='pl-2'>
                                            <p className='text-sm text-left'>{appUser?.username}</p>
                                            <p className='text-sm text-neutral-content'>ID: {appUser?.id}</p>
                                        </div>
                                    </div>
                                    <GearsIcon onClick={handleOpenSetting} className='text-gray-400 hover:text-white hover:cursor-pointer hover:animate-spin-slow' size={32}/>
                                </div>
                            </div>
                            <div className='ml-2 p-2 w-full bg-base-300'>
                                {selectedConversation ? 
                                <ConversationWindow conversation={selectedConversation} userId={appUser!.id} headerData={
                                    recentConversations.find((c)=>c.id== selectedConversation.id) || selectedConversation
                                }/>
                                : 
                                <FriendList userId={appUser!.id} setSelectedConversation={setSelectedConversation}/>
                                }
                            </div>
                            <RequestModal cacheRef={requestCacheRef} listRef={requestListRef} renderer={renderRequests} data={friendRequests} setModalOpen={setModalOpen} handleDeclineAll={handleDeclineAll}/>

                            <SettingModal user={appUser} logOut={logOut}/>
                        </div>
                    )
                ) : (
                <Navigate to='/' />
                )}
        </div>
    )
}

export default HomePage