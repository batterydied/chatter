import type { User } from 'firebase/auth'
import { Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchUserFromDB, subscribeConversation, renderConversations } from './homePageHelpers'
import type { AppUser, Conversation } from './homePageHelpers'
import NewUserModal from './components/NewUserModal'
import FriendList from './components/FriendList'
import ConversationWindow from './components/ConversationWindow'
import { RequestIcon, UserIcon } from '../../assets/icons'
import { collection, DocumentSnapshot, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase'

type HomeProps = {
    user: User | null
    logOut: () => void,
}

type FriendRequest = {
    from: string
}

const HomePage = ({user, logOut} : HomeProps) => {
    const [isNewUser, setIsNewUser] = useState<boolean | null>(null)
    const [appUser, setAppUser] = useState<AppUser | null>(null)
    const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const navigate = useNavigate();

    useEffect(()=>{
        if(!user) {
            navigate("/", { replace: true });
            return;
        }
        if(user.email){
            const checkUser = async (email: string) => {
                await fetchUserFromDB(email, setIsNewUser, setAppUser, setLoading)
            }
            checkUser(user.email)
        }
    }, [user, navigate])

    useEffect(()=>{
        if(!appUser) return
        const queryRef = query(collection(db, "relations"),
        where("to", "==", appUser.id),
        where("status", "==", "pending"))

        const unsub = onSnapshot(queryRef, (snapshot)=>{
            const serializedFriendRequests = serializeFriendRequests(snapshot.docs)
            setFriendRequests(serializedFriendRequests)
        })

        return unsub
    }, [appUser])

    useEffect(()=>{
        if(appUser){
            const unsub = subscribeConversation(appUser.id, setRecentConversations, setLoading)
            return unsub
        }
    }, [appUser])

    if(loading){
        return (
            <div className="w-full h-full flex justify-center items-center">
                <span className="loading loading-ring loading-xl"></span>
            </div>
        );
    }

    const handleOpenRequest = () => {
        (document.getElementById('request_modal') as HTMLDialogElement)!.showModal();
    }

    const serializeFriendRequests = (docs: DocumentSnapshot[]) => {
        return docs
        .map((doc) => {
        const data = doc.data() as FriendRequest | undefined;
        if (!data) return null;
        return {
            from: data.from,
            // other fields if needed
        };
        })
        .filter((r): r is FriendRequest => r !== null); // filter out nulls safely
    }

    return (
        <div className='w-full h-full flex justify-center items-center'>
            {user && user.email ? (
                isNewUser ? (
                    <NewUserModal setIsNewUser={setIsNewUser} email={user.email} setAppUser={setAppUser} user={user}/>
                ) : (
                    <div className='flex flex-row w-full h-full'>
                        <div className='min-w-[360px]'>
                            <ul className='list h-5/6 overflow-y-auto'>
                                <li>
                                    <button className='btn justify-start w-full border-0 shadow-none bg-base-100 hover:bg-base-300' onClick={()=>setSelectedConversation(null)}>
                                        <UserIcon iconColor='white' />
                                        Friends
                                    </button>
                                </li>
                                <li>
                                    <button className='btn justify-start w-full border-0 shadow-none bg-base-100 hover:bg-base-300' onClick={handleOpenRequest}>
                                        <RequestIcon iconColor='white'/>
                                        Requests
                                    </button>
                                </li>
                                <div className='border-b border-gray-700 pb-2' />
                                <div className='my-1 flex justify-start text-gray-600 text-sm'>
                                    Direct Messages
                                </div>
                                {renderConversations(recentConversations, setSelectedConversation, selectedConversation)}
                            </ul>
                            <div className='flex h-1/6 justify-between items-center bg-base-300 p-5 rounded-2xl outline-1 outline-base-100'>
                                <div className='flex flex-row items-center'>
                                    <div className="avatar avatar-online avatar-placeholder">
                                        <div className="bg-neutral text-base-content w-16 rounded-full">
                                            <span className="text-xl">{appUser?.username.slice(0, 2)}</span>
                                        </div>
                                    </div>
                                    <div className='pl-2'>
                                        <p className='text-sm text-left'>{appUser?.username}</p>
                                        <p className='text-neutral-content'>status</p>
                                    </div>
                                </div>
                                <button className='btn btn-neutral' onClick={logOut}>L</button>
                            </div>
                        </div>
                        <div className='ml-2 p-2 w-full bg-base-300'>
                            {selectedConversation ? 
                            <ConversationWindow conversationId={selectedConversation} userId={appUser!.id}/>
                            : 
                            <FriendList userId={appUser!.id} setSelectedConversation={setSelectedConversation}/>
                            }
                        </div>
                        <dialog id="request_modal" className="modal">
                            <div className="modal-box">
                                <form method="dialog">
                                    {/* if there is a button in form, it will close the modal */}
                                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                                    <h3 className="font-bold text-lg">Requests</h3>
                                    {friendRequests.length === 0 && <h3>There are no pending requests.</h3>}
                                </form>
                            </div>
                        </dialog>
                    </div>
                )
                ) : (
                <Navigate to='/' />
                )}
        </div>
    )
}

export default HomePage