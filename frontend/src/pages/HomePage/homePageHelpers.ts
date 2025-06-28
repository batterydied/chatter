import axios from 'axios'
import { db } from '../../config/firebase'
import { collection, where, query, onSnapshot } from 'firebase/firestore'

export type AppUser = {
    id: string,
    createdAt: string,
    username: string,
    email: string
}

export type Conversation = {
    id: string,
    name: string
}

export const fetchUserFromDB = async (
    email: string, 
    newUserSetter: (isNewUser: boolean)=>void, 
    appUserSetter: (appUser: AppUser)=>void
) => {
    try{
        const res = await axios.get(import.meta.env.VITE_BACKEND_API_URL + `user/${email}`)
        const data = res.data
        appUserSetter(data.user)
        newUserSetter(false)
    }catch(e){
        if (axios.isAxiosError(e) && e.response?.status === 404) {
            newUserSetter(true);
        }else{
            console.log('Unknown error occurred')
        }
    }
}

export const createUser = async (email: string, username: string) => {
    try{
        const fields = {
            email,
            name: username
        }
        const res = await axios.post(import.meta.env.VITE_BACKEND_API_URL + `user`, fields)
        console.log(res.data)
    }catch(e){
        if (axios.isAxiosError(e)) {
            console.log(e.message)
        }else{
            console.log('Unknown error occurred')
        }
    }
}

export const subscribeConversation = (userId: string, setter: (conversations: Conversation[])=>void) => {
    const queryRef = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    const unsub = onSnapshot(queryRef, (snapshot)=>{
        const conversations: Conversation[] = snapshot.docs.map((doc)=>(
            {
                id: doc.id,
                name: doc.data().name
            }
        ))
        setter(conversations)
    })

    return unsub
}