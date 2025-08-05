import { useState, useEffect, useRef } from "react"
import axios from 'axios'
import { db } from '../../../config/firebase'
import { doc, getDoc, query, collection, where, getDocs, onSnapshot } from 'firebase/firestore'
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, type ListRowRenderer } from "react-virtualized"

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
    const [selectedOnline, setSelectedOnline] = useState<boolean>(false)
    const onlineFriendRef = useRef<HTMLButtonElement>(null)
    const allFriendRef = useRef<HTMLButtonElement>(null)

    const cellMeasurerCache = useRef(new CellMeasurerCache({fixedWidth: true, defaultHeight: 100}))
    const listRef = useRef<List>(null)
    const friendDict = useRef<Record<string, ()=>void>>({})

    const handleOnlineFriends = ()=>{
        setSelectedOnline(true)
        onlineFriendRef.current?.focus()
    }

    const handleAllFriends = ()=>{
        setSelectedOnline(false)
        allFriendRef.current?.focus()
    }
    useEffect(()=>{
        if(selectedOnline){
            onlineFriendRef.current?.focus()
        }
    }, [selectedOnline])

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
                    console.log(e)
                }
            }

        }
        retrieveFriends()
    }, [userId])
    const renderFriends: ListRowRenderer = ({ index, key, parent, style }) => {
        const friend = friends[index]
        return (
            <CellMeasurer
                key={key}
                cache={cellMeasurerCache.current}
                parent={parent}
                columnIndex={0}
                rowIndex={index}
            >
                {()=>
                <div style={style} onClick={async ()=> await openConversation(friend.friendId, userId)} className='rounded-none list-row border-b border-b-base-100 cursor-pointer hover:bg-neutral hover:rounded-xl'>
                    <p>{friend.username}</p>
                </div>
                }
            </CellMeasurer>
        )
    };

    useEffect(()=>{
        friends.forEach((friend)=>{
            if(friend.friendId in friendDict){
                return
            }

            const friendRef = doc(db, 'users',  friend.friendId);
            const unsub = onSnapshot(friendRef, async (snapshot)=>{
                if (!snapshot.exists()) return;
                
                const [serializedFriend] = (await serializeFriends([{
                    id: friend.relationshipId,
                    data: {
                        from: friend.friendId
                    }
                }]))
                
                if(serializedFriend){
                    setFriends((prev)=>
                    prev.map((f)=>(f.friendId === friend.friendId ? serializedFriend : f))
                )}
                else{
                    setFriends((prev)=>prev.filter((f)=>f.friendId !== friend.friendId))
                }
                
            })
            friendDict.current[friend.friendId] = unsub
        })
    }, [friends])

    useEffect(()=>{
        for (const key in friendDict.current) {
            friendDict.current[key]()
        }
        friendDict.current = {}
    }, [userId])

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
        <div className='list justify-start'>
            <div className='mb-2 border-b border-base-100 pb-2'>
                <div className='flex items-start space-x-2'>
                    <button className='btn pointer-events-none cursor-default bg-base-300 border-none shadow-none'>
                        <span>Friends</span>
                    </button>
                    <button ref={onlineFriendRef} className='btn bg-base-300 focus:outline-none shadow-none border-0 hover:border hover:border-base-accent focus:bg-base-100' onClick={handleOnlineFriends}>Online</button>
                    <button ref={allFriendRef} className='btn bg-base-300 focus:ring-0 shadow-none border-0 hover:border hover:border-base-accent focus:bg-base-100' onClick={handleAllFriends}>All</button>
                    <button className='btn bg-primary border-none hover:opacity-80 rounded-lg'>Add Friend</button>
                </div>
            </div>
            <AutoSizer>
                {({width, height})=>
                    <List
                    width={width}
                    height={height}
                    rowHeight={cellMeasurerCache.current.rowHeight}
                    deferredMeasurementCache={cellMeasurerCache.current}
                    rowCount={friends.length}
                    rowRenderer={renderFriends}
                    ref={listRef}
                    />
                }
            </AutoSizer>
        </div>
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