import type { User } from 'firebase/auth'
import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchUserFromDB, subscribeConversation, renderConversations } from './homePageHelpers'
import type { AppUser, Conversation } from './homePageHelpers'
import NewUserModal from './components/NewUserModal'
import FriendList from './components/FriendList'
import ConversationWindow from './components/ConversationWindow'

type HomeProps = {
    user: User | null
    logOut: () => void,
}


const HomePage = ({user, logOut} : HomeProps) => {
    const [isNewUser, setIsNewUser] = useState<boolean | null>(null)
    const [appUser, setAppUser] = useState<AppUser | null>(null)
    const [recentConversations, setRecentConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

    useEffect(()=>{
        if(user && user.email){
            const checkUser = async (email: string) => {
                await fetchUserFromDB(email, setIsNewUser, setAppUser, setLoading)
            }
            checkUser(user.email)
        }
    }, [user])

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

    return (
        <div className='w-full h-full flex justify-center items-center'>
            {user && user.email ? (
                isNewUser ? (
                    <NewUserModal setIsNewUser={setIsNewUser} email={user.email} setAppUser={setAppUser}/>
                ) : (
                    <div className='flex flex-row w-full h-full'>
                        <div className='min-w-[360px]'>
                            <ul className='list h-5/6 overflow-y-auto'>
                                <li>
                                    <button className='btn justify-start after:' onClick={()=>setSelectedConversation(null)}>Friends</button>
                                </li>
                                {renderConversations(recentConversations, setSelectedConversation)}
                            </ul>
                            <div className='flex h-1/6 justify-between items-center bg-base-300 p-5 rounded-2xl outline-1 outline-base-100'>
                                <div className='flex flex-row items-center'>
                                    <div className="avatar avatar-online avatar-placeholder">
                                        <div className="bg-neutral text-base-content w-16 rounded-full">
                                            <span className="text-xl">{appUser?.username.slice(0, 2)}</span>
                                        </div>
                                    </div>
                                    <div className='pl-2'>
                                        <p className='text-sm'>{appUser?.username}</p>
                                        <p className='text-neutral-content'>status</p>
                                    </div>
                                </div>
                                <button className='btn btn-neutral' onClick={logOut}>L</button>
                            </div>
                        </div>
                        <div className='px-12 w-full'>
                            {selectedConversation ? 
                            <ConversationWindow conversationId={selectedConversation} userId={appUser!.id}/>
                            : 
                            <FriendList userId={appUser!.id}/>}
                        </div>
                    </div>
                )
                ) : (
                <Navigate to='/' />
                )}
        </div>
    )
}

export default HomePage