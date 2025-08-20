import axios from 'axios'
import { db } from '../../config/firebase'
import { collection, where, query, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore'
import { supabase } from '../../config/supabase'

export type AppUser = {
    id: string,
    createdAt: string,
    username: string,
    email: string,
    pfpFilePath: string
}

export type FriendRequest = {
    requestId: string,
    from: string,
    username: string,
    pfpFilePath: string
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

export const subscribeConversations = (
  userId: string,
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>,
  setLoading: (bool: boolean) => void
) => {

  const convQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  const unsubConversations = onSnapshot(
    convQuery, 
    async (snapshot) => {
      const conversations: Conversation[] = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: await serializeName(data.name, data.participants, userId),
            hiddenBy: data.hiddenBy || [],
            participants: data.participants || [],
            pfpFilePath: data.pfpFilePath,
            directConversationId: data.directConversationId,
            isOnline: false,
          };
        })
      );
      setConversations(conversations);
  })

  return () => {
    unsubConversations();
    setLoading(false);
  };
};

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

export const getPfpByFilePath = (filePath: string) => {
    if(!filePath){
        return supabase.storage.from('avatars').getPublicUrl('default/default_user.png').data.publicUrl
    }
    return supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl
}

