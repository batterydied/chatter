import axios from 'axios'
import { db } from '../../config/firebase'
import { collection, where, query, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore'

export type AppUser = {
    id: string,
    createdAt: string,
    username: string,
    email: string
}

export type Conversation = {
    id: string,
    name: string,
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
            console.log('Unknown error occurred')
        }
    }
}

export const createUser = async (email: string, username: string, setAppUser: (user: AppUser)=>void) => {
    try{
        const fields = {
            email,
            name: username
        }
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/user`, fields)
        setAppUser(res.data.user)
    }catch(e){
        if (axios.isAxiosError(e)) {
            console.log(e.message)
        }else{
            console.log('Unknown error occurred')
        }
    }
}

export const subscribeConversation = (
    userId: string, 
    setter: (conversations: Conversation[])=>void,
    setLoading: (isLoading: boolean)=>void
) => {
    const queryRef = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );
    const unsub = onSnapshot(queryRef, async (snapshot)=>{
        const conversations: Conversation[] = await Promise.all(snapshot.docs.map(async (doc)=>(
            {
                id: doc.id,
                name: await serializeName(doc.data().name, doc.data().participants, userId)
            }
        )))
        setter(conversations)
        setLoading(false)
    })

    return unsub
}

const serializeName = async (name: string, participants: string[], userId: string) => {
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

export const renderConversations = (
    conversations: Conversation[], 
    setSelectedConversation: (conversationId: string | null)=>void,
    selectedConversation: string | null
) => {
  return conversations.map((c) => {
    const highlightConversation = selectedConversation == c.id
    return (
        <li className={`list-row no-list-divider cursor-pointer transition-colors hover:bg-neutral ${highlightConversation ? 'bg-base-300' : ''}`}
        onClick={()=>{
            setSelectedConversation(c.id)
        }} 
        key={c.id}>
            <p>{c.name}</p>
        </li>
    )
    });
};

