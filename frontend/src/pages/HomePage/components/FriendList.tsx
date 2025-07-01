import { useState, useEffect } from "react"
import { renderFriends } from "../homePageHelpers"
import axios from 'axios'
import { db } from '../../../config/firebase'
import { doc, getDoc } from 'firebase/firestore'

type FriendProps = {
    userId: string
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

const FriendList = ({userId}: FriendProps) => {
    const [friends, setFriends] = useState<Friend[]>([])

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

    return (
        <ul className='list bg-base-100 rounded-box shadow-md'>
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