import { useState, useEffect } from "react"
import axios from 'axios'
import { db } from '../../../config/firebase'
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore'

type FriendListProps = {
    userId: string,
    setSelectedConversation: (conversationId: string) => void
}

type RawFriend = {
    id: string,
    data: {
        from: string
    }
}

export type Friend = {
    relationshipId: string,
    friendId: string,
    username: string
}

const FriendList = ({userId, setSelectedConversation}: FriendListProps) => {
    const [friends, setFriends] = useState<Friend[]>([])
    const [onlineFriends, setOnlineFriends] = useState<Friend[]>([])

    useEffect(()=>{
        const retrieveFriends = async () => {
            try{
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}/relation/friend/${userId}`)
                const serializedFriends = await serializeFriends(res.data.friends)
                setFriends(serializedFriends.filter((f)=> f !== undefined))
            }catch(e){
                if (axios.isAxiosError(e)) {
                    console.log(e.message)
                } else {
                    console.log('Unknown error occurred')
                }
            }

        }
        retrieveFriends()
    }, [userId])
    const renderFriends = (friends: Friend[]) => {
        return friends.map((f) => (
            <li onClick={async ()=> await openConversation(f.friendId, userId)} className='rounded-none list-row border-b border-b-base-100 cursor-pointer hover:bg-base-100 hover:rounded-xl' key={f.relationshipId}>
                <p>{f.username}</p>
            </li>
        ));
    };

    const openConversation = async (userId1: string, userId2: string) => {
        const queryRef = query(collection(db, 'conversations'), where('directConversationId', '==', [userId1, userId2].sort().join('_')))

        try{
            const docSnapshot = await getDocs(queryRef)

            if(docSnapshot.empty){
                const reqBody = {
                    participants: [userId1, userId2],
                    isDirect: true
                }
                const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/conversation`, reqBody)
                setSelectedConversation(res.data.conversationId)
            }else{
                setSelectedConversation(docSnapshot.docs[0].id)
            }
        }catch(e){
            if(axios.isAxiosError(e)){
                console.log(e)
            }else{
                console.log('Unknown error occurred')
            }
        }

    }
    return (
        <ul className='list justify-start'>
            <li className='mb-2 border-b border-base-100 pb-2'>
                <div className='flex items-start space-x-2'>
                    <button className='btn pointer-events-none cursor-default bg-base-300 border-none shadow-none'>
                        <span>Friends</span>
                    </button>
                    <button className='btn bg-base-300 shadow-none border-0 hover:border hover:border-base-accent'>Online</button>
                    <button className='btn bg-base-300 shadow-none border-0 hover:border hover:border-base-accent'>All</button>
                    <button className='btn bg-primary border-none hover:opacity-80 rounded-lg'>Add Friend</button>
                </div>
            </li>
            {renderFriends(friends)}
        </ul>
    )

}

const serializeFriends = async (rawFriends: RawFriend[]) => {
    return await Promise.all(rawFriends.map(async (f)=>{
        const docRef = doc(db, 'users', f.data.from)
        const docSnapshot = await getDoc(docRef)
        if(docSnapshot.exists()){
            return {
                relationshipId: f.id,
                friendId: f.data.from,
                username: docSnapshot.data().username
            }
        }
    }))
}


export default FriendList