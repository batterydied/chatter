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

export type Friend = {
    status: string
    userId: string
    username: string
}

export const fetchUserFromDB = async (
    email: string, 
    newUserSetter: (isNewUser: boolean)=>void, 
    appUserSetter: (appUser: AppUser)=>void,
    setLoading: (isLoading: boolean)=>void
) => {
    try{
        const res = await axios.get(import.meta.env.VITE_BACKEND_API_URL + `user/${email}`)
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
        const res = await axios.post(import.meta.env.VITE_BACKEND_API_URL + `user`, fields)
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
                name: await serializedName(doc.data().name, doc.data().participants, userId)
            }
        )))
        setter(conversations)
        setLoading(false)
    })

    return unsub
}

const serializedName = async (name: string, participants: string[], userId: string) => {
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

export const renderConversations = (conversations: Conversation[]) => {
  return conversations.map((c) => (
    <li className='list-row no-list-divider' key={c.id}>
        <p>{c.name}</p>
    </li>
  ));
};

export const renderFriends = (friends: Friend[]) => {
  return friends.map((f) => (
    <li className='list-row' key={f.userId}>
        <p>{f.username}</p>
    </li>
  ));
};


export const mockFriendData: Friend[] = [
    {
        userId: '1',
        status: 'online',
        username: 'Ben'
    
    },
    {
        userId: '2',
        status: 'online',
        username: 'Len'
    
    },
    {
        userId: '3',
        status: 'online',
        username: 'Cen'
    
    }


]