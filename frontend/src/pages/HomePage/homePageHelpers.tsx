import axios from 'axios'
import { db } from '../../config/firebase'
import { doc, getDoc, Timestamp } from 'firebase/firestore'

export type AppUser = {
    id: string,
    createdAt: string,
    username: string,
    email: string,
    pfpFilePath: string,
    lastSeenRequest: Timestamp
}

export type FriendRequest = {
    requestId: string,
    from: string,
    username: string,
    pfpFilePath: string,
    createdAt: Timestamp
}

export type Conversation = {
    id: string,
    name: string,
    hiddenBy: string[],
    participants: string[],
    pfpFilePath: string,
    directConversationId: string,
    isOnline: boolean
}

export type HeaderData = {
    displayName: string, 
    displayPfpFilePath: string, 
    displayIsOnline: boolean
}

export const fetchUserFromDB = async (
    email: string, 
    newUserSetter: (isNewUser: boolean)=>void, 
    appUserSetter: (appUser: AppUser)=>void,
    setLoading: (isLoading: boolean)=>void
) => {
    try{
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}/user/${email}`)
        const data = res.data
        appUserSetter(data.user)
        newUserSetter(false)
    }catch(e){
        if (axios.isAxiosError(e) && e.response?.status === 404) {
            newUserSetter(true);
            setLoading(false)
        }else{
            console.error('Unknown error occurred')
        }
    }
}

export const createUser = async (uid: string, email: string, username: string, setAppUser: (user: AppUser)=>void) => {
    try{
        const fields = {
            uid,
            email,
            username
        }
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/user`, fields)
        setAppUser(res.data.user)
    }catch(e){
        if (axios.isAxiosError(e)) {
            console.error(e.message)
        }else{
            console.error('Unknown error occurred')
        }
    }
}

export const serializeName = async (name: string, participants: string[], userId: string) => {
    const MAX_LENGTH = 15
    if(name == ""){
        const filteredIds = participants.filter((participant) => participant != userId)
        const usernames = await Promise.all(
            filteredIds.map(async (id) => {
                const docRef = doc(db, 'users', id);
                const docSnapshot = await getDoc(docRef);
                return docSnapshot.exists() ? docSnapshot.data().username : 'Unknown User';
            })
        );
        const filteredName = usernames.join(', ')
        return filteredName.length <= MAX_LENGTH ? filteredName : filteredName.slice(0, MAX_LENGTH - 1) + '…';
    }else{
        return name
    }
}

