import type { User } from 'firebase/auth'
import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchUserFromDB, subscribeConversation } from './homePageHelpers'
import type { AppUser, Conversation } from './homePageHelpers'
import NewUserModal from './components/NewUserModal'

type HomeProps = {
    user: User | null
    logOut: () => void,
}


const HomePage = ({user, logOut} : HomeProps) => {
    const [isNewUser, setIsNewUser] = useState<boolean | null>(null)
    const [appUser, setAppUser] = useState<AppUser | null>(null)
    const [recentConversations, setRecentConversations] = useState<Conversation[]>([])

    useEffect(()=>{
        if(user && user.email){
            const checkUser = async (email: string) => {
                await fetchUserFromDB(email, setIsNewUser, setAppUser)
            }
            checkUser(user.email)
        }
    }, [user])

    useEffect(()=>{
        const unsub = subscribeConversation(setRecentConversations)
        return unsub
    }, [appUser])

    if(isNewUser === null){
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
                    <NewUserModal setIsNewUser={setIsNewUser} email={user.email}/>
                ) : (
                    <div className='flex flex-row w-full h-full'>
                        <div className='w-1/4'>
                            <div className='list h-5/6 overflow-y-auto'>
                                <p className='list-row'> bi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                                <p className='list-row'> hi</p>
                            </div>
                            <div className='flex h-1/6 justify-between items-center'>
                                <p>{appUser?.username}</p>
                                <button className='btn btn-neutral' onClick={logOut}>Log out</button>
                            </div>
                        </div>
                        <div className='w-3/4'>
                            <p>placeholder</p>
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