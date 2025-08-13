import { useState, useEffect, useRef } from "react"
import axios from 'axios'
import { db } from '../../../config/firebase'
import { doc, getDoc, query, collection, where, getDocs, onSnapshot, and, or, DocumentSnapshot, QueryDocumentSnapshot, deleteDoc, updateDoc } from 'firebase/firestore'
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, type ListRowRenderer } from "react-virtualized"
import { RemoveUserIcon } from "../../../assets/icons"
import { toast } from "sonner"
import forceRemeasure from "../../../utils/forceRemeasure"
import { serializeName, type Conversation } from "../homePageHelpers"

type FriendListProps = {
    userId: string,
    setSelectedConversation: (conversation: Conversation) => void
}

export type Friend = {
    relationshipId: string,
    friendId: string,
    username: string,
    isOnline: boolean
}

type OutgoingRequest = {
    to: string,
    username: string,
    id: string
}

const FriendList = ({userId, setSelectedConversation}: FriendListProps) => {
    const [friends, setFriends] = useState<Friend[]>([])
    const [selectedOnline, setSelectedOnline] = useState<boolean>(true)
    const onlineFriendRef = useRef<HTMLButtonElement>(null)
    const allFriendRef = useRef<HTMLButtonElement>(null)
    const [removeFriend, setRemoveFriend] = useState<Friend | null>(null)
    const [searchId, setSearchId] = useState<string>('')
    const [successRequestMessage, setSuccessRequestMessage] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([])
    const [modalOpen, setModalOpen] = useState(false)

    const cellMeasurerCache = useRef(new CellMeasurerCache({fixedWidth: true, defaultHeight: 100}))
    const listRef = useRef<List>(null)
    const friendDict = useRef<Record<string, ()=>void>>({})

    const handleOnlineFriends = ()=>{
        setSelectedOnline(true)
    }

    const handleAllFriends = ()=>{
        setSelectedOnline(false)
    }

    const handleWithdraw = async (outgoingRequestId: string) => {
        const docRef = doc(db, 'relations', outgoingRequestId)
        await deleteDoc(docRef)
    }

    useEffect(()=>{
        const queryRef = query(collection(db, 'relations'), where('to', '==', userId), where('status', '==', 'friend'))
        const unsub = onSnapshot(queryRef, async (snapshot)=>{
            const docs = snapshot.docs
            setFriends(await serializeFriends(docs))
            forceRemeasure(cellMeasurerCache, listRef)
        })
        return unsub
    }, [userId])

    const handleRemoveConfirmation = (friend: Friend) => {
        setRemoveFriend(friend);
        (document.getElementById('remove_confirmation_modal') as HTMLDialogElement)!.showModal();
    }

    const handleAddFriend = () => {
        (document.getElementById('add_friend_modal') as HTMLDialogElement)!.showModal();
    }

    const renderRequests: ListRowRenderer= ({ index, key, parent, style }) => {
        const request = outgoingRequests[index]
        return (
            <CellMeasurer
                key={key}
                cache={cellMeasurerCache.current}
                parent={parent}
                columnIndex={0}
                rowIndex={index}
            >
                {()=>{
                    return (
                        <div style={style}>
                            <div className='p-2 hover:bg-base-200 flex justify-between'>
                                <div className='flex flex-col items-start'>
                                    <div>
                                        {request.username}
                                    </div>
                                    <div className='text-xs'>
                                        {request.to}
                                    </div>
                                </div>
                                <div className='btn bg-red-600 hover:bg-red-700 active:bg-red-800' onClick={()=>handleWithdraw(request.id)}>
                                    Withdraw
                                </div>
                            </div>
                        </div>
                    )
                }}
            </CellMeasurer>
        )

    }
    
    const validateRequest = async () => {
        if(searchId == userId){
            setErrorMessage("You can't add yourself.")
            return false
        }
        const userSnapshot = await getDoc(doc(db, 'users', searchId))
        if(!userSnapshot.exists()){
            setErrorMessage("User doesn't exist.")
            setSuccessRequestMessage(false)
            return false
        }
        const queryRef = query(
            collection(db, 'relations'), 
            or(
                and(where("to", "==", searchId), where("from", "==", userId)),
                and(where("to", "==", userId), where("from", "==", searchId))
            )
        )
        const snapshot = await getDocs(queryRef)

        if(snapshot.empty){
            return true
        }
        for(const doc of snapshot.docs){
            if(doc.data().status === 'friend'){
                setErrorMessage("You're already friend with that user.")
            }
            else if(doc.data().status === 'pending'){
                setErrorMessage("There's a pending request already.")
            }
            else{
                setErrorMessage("You can't send a request to that user.")
            }

        }

        setSuccessRequestMessage(false)
        return false
    }

    const sendRequest = async () => {
        try{
            await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/relation/friend-request`, {
                from: userId,
                to: searchId
            })
            setErrorMessage('')
            setSuccessRequestMessage(true)
            setSearchId('')
        }catch{
            toast.error('Could not send friend request, check the user ID.')
        }
    }

    const handleSend = async () => {
        if(await validateRequest()){
            sendRequest()
        }
    }   

    const handleCloseRequest = () => {
        setSearchId('')
        setSuccessRequestMessage(false)
        setErrorMessage('')
    }

    const isValidSearchId = (searchId: string) => {
        return searchId.length === 20
    }

    const handleOutgoingRequest = () => {
        (document.getElementById('outgoing_request_modal') as HTMLDialogElement)!.showModal();
        setModalOpen(true)
    }

    const sendRemove = async (friendId: string) => {
        try{
            await axios.delete(`${import.meta.env.VITE_BACKEND_API_URL}/relation/delete-friend`, {
                data: {
                    from: userId,
                    to: friendId
                }
            })
            setFriends((prev) => prev.filter((f) => f.friendId != friendId))
            setRemoveFriend(null)
            forceRemeasure(cellMeasurerCache, listRef)
        }catch{
            toast.error('Could not remove friend, try again later.')
        }
    }

    const renderFriends: ListRowRenderer = ({ index, key, parent, style }) => {
        const friend = friends[index]
        if(selectedOnline && !friend.isOnline) return null
        return (
            <CellMeasurer
                key={key}
                cache={cellMeasurerCache.current}
                parent={parent}
                columnIndex={0}
                rowIndex={index}
            >
                {()=>
                <div style={style} className='relative'>
                    <div onClick={async ()=> await openConversation(friend.friendId, userId)} className='rounded-none list-row cursor-pointer hover:bg-neutral hover:rounded-xl flex justify-start items-center overflow-hidden'>
                        <div className={`avatar ${friend.isOnline ? 'avatar-online' : 'avatar-offline'}`}>
                            <div className="w-10 rounded-full">
                                <img src="https://img.daisyui.com/images/profile/demo/gordon@192.webp" />
                            </div>
                        </div>
                        <p>{friend.username}</p>
                        <div className='ml-auto hover:bg-base-300 rounded-full p-2' onClick={(e)=>{
                            e.stopPropagation()
                            handleRemoveConfirmation(friend)
                        }}>
                            <RemoveUserIcon iconColor={'red'}/>
                        </div>
                    </div>
                </div>
                }
            </CellMeasurer>
        )
    };

    const serializeRequest = async (docs: DocumentSnapshot[]) => {
        const unfiltered = await Promise.all(docs.map(async (d)=>{
            const data = d.data()
            if(!data) return null

            const userRef = doc(db, 'users', data.to)
            const userSnapshot = await getDoc(userRef)

            if(!userSnapshot.exists()) return null

            return {
                to: data.to,
                username: userSnapshot.data().username,
                id: d.id
            }
        }))

        return unfiltered.filter((el): el is OutgoingRequest => el != null)
    }

    useEffect(()=>{
        const queryRef = query(collection(db, 'relations'), where('from', '==', userId), where('status', '==', 'pending'))
        const unsub = onSnapshot(queryRef, async (snapshot)=>{
            setOutgoingRequests(await serializeRequest(snapshot.docs))
        })
        return unsub
    }, [userId])

    useEffect(()=>{
        if(!modalOpen) return

        const fetchUpdatedRequests = async () => {
        const updatedRequests = await Promise.all(
        outgoingRequests.map(async (req) => {
            const docSnap = await getDoc(doc(db, 'users', req.to));
            if (!docSnap.exists()) return null;
            const data = docSnap.data();
            return {
            to: req.to,
            id: req.id,
            username: data.username,
            };
        })
        );

        const filtered = updatedRequests.filter((req) => req !== null);
        setOutgoingRequests(filtered);
    };

    fetchUpdatedRequests();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalOpen])

    useEffect(()=>{
        const currentFriendsSet = new Set(friends.map(f => f.friendId));

        Object.keys(friendDict.current).forEach((id) => {
            if (!currentFriendsSet.has(id)) {
                friendDict.current[id](); // unsubscribe
                delete friendDict.current[id];
            }
        });

        friends.forEach((friend)=>{
            if(friend.friendId in friendDict){
                return
            }

            const friendRef = doc(db, 'users',  friend.friendId);
            const unsub = onSnapshot(friendRef, async (snapshot)=>{
                if (!snapshot.exists()){
                    setFriends((prev)=>prev.filter((f)=>f.friendId !== friend.friendId))
                    forceRemeasure(cellMeasurerCache, listRef)
                    return
                }
                
                const data = snapshot.data()

                const updatedFriend = {
                    relationshipId: friend.relationshipId,
                    friendId: friend.friendId,
                    username: data.username,
                    isOnline: data.isOnline
                }
                

                setFriends((prev)=>
                prev.map((f)=>(f.friendId === friend.friendId ? updatedFriend : f)))

                forceRemeasure(cellMeasurerCache, listRef)
    
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
                const data = res.data.data
                const conversation = {
                    id: data.conversationId,
                    name: await serializeName(data.name, data.participants, userId),
                    hiddenBy: data.hiddenBy,
                    participants: data.participants
                }
                setSelectedConversation(conversation)
            }else{
                const selectedDoc = docSnapshot.docs[0]
                const data = selectedDoc.data()
                setSelectedConversation({
                    id: selectedDoc.id,
                    name: await serializeName(data.name, data.participants, userId),
                    hiddenBy: data.hiddenBy,
                    participants: data.participants
                })
                await updateDoc(selectedDoc.ref, {hiddenBy: selectedDoc.data().hiddenBy.filter((id: string) => id !== userId)})
            }
        }catch(e){
            if(axios.isAxiosError(e)){
                toast.error(e.message)
            }else{
                console.log(e)
            }
        }
    }
    return (
        <div className='list justify-start h-full overflow-hidden'>
            <div className='mb-2 border-b border-gray-700 pb-2'>
                <div className='flex items-start space-x-2'>
                    <button ref={onlineFriendRef} className={`btn bg-base-300 focus:outline-none shadow-none border-0 hover:border hover:bg-base-100 hover:border-none ${selectedOnline && '!bg-base-100'}`} onClick={handleOnlineFriends}>Online</button>
                    <button ref={allFriendRef} className={`btn bg-base-300 focus:ring-0 shadow-none border-0 hover:border hover:bg-base-100 hover:border-none ${!selectedOnline && '!bg-base-100'}`} onClick={handleAllFriends}>All</button>
                    <button className='btn bg-base-300 focus:outline-none shadow-none border-0 hover:border hover:bg-base-100 hover:border-none' onClick={handleOutgoingRequest}>Outgoing Request</button>
                    <button className='btn bg-primary rounded-lg' onClick={handleAddFriend}>Add Friend</button>
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
            <dialog id="remove_confirmation_modal" className="modal">
                <div className="modal-box pb-12">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <div className='absolute bottom-2 right-4'>
                            <button className="btn btn-sm bg-gray-500 mr-2 hover:!border-gray-500 hover:bg-gray-600" onClick={()=>setRemoveFriend(null)}>Cancel</button>
                            <button className="btn btn-sm bg-red-500 hover:!border-red-500 hover:bg-red-600" onClick={()=>sendRemove(removeFriend!.friendId)}>Remove Friend</button>
                        </div>
                    </form>
                    <h3 className="font-bold text-lg">Remove '{removeFriend?.username}'</h3>
                    <h3 className="text-md">Are you sure you want to remove {removeFriend?.username} from your friends?</h3>
                </div>
            </dialog>

            <dialog id="add_friend_modal" className="modal" onClose={handleCloseRequest}>
                <div className="modal-box">
                    <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" 
                        onClick={handleCloseRequest}>✕</button>
                    <h3 className="font-bold text-lg">Add Friend</h3>
                    <div>Your friend ID: {userId}</div>
                    <input type="text" onChange={(e)=>setSearchId(e.target.value)} value={searchId} placeholder="Enter user ID: " className="input my-2"/>
                    </form>
                    <button onClick={handleSend} className={`btn btn-primary ${!isValidSearchId(searchId) && 'pointer-events-none opacity-50'}`}>Send Friend Request</button>
                    {successRequestMessage && <div className='text-green-400 m-2'>Friend request sent successfully!</div>}
                    {errorMessage && <div className='text-red-400 m-2'>{errorMessage}</div>}
                </div>
            </dialog>
             <dialog id="outgoing_request_modal" className="modal" onCancel={()=>setModalOpen(false)}>
                <div className="modal-box">
                    <form method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={()=>setModalOpen(false)}>✕</button>
                        <h3 className="font-bold text-lg">Outgoing Requests</h3>
                        {outgoingRequests.length === 0 ?  <h3>There are no outgoing requests.</h3> :
                        <div className='h-64'>
                            <AutoSizer>
                                {({width, height})=>
                                <List
                                    width={width}
                                    height={height}
                                    rowHeight={cellMeasurerCache.current.rowHeight}
                                    deferredMeasurementCache={cellMeasurerCache.current}
                                    rowCount={outgoingRequests.length}
                                    rowRenderer={renderRequests}
                                    ref={listRef}
                                />
                                }           
                            </AutoSizer>
                        </div>
                        }
                    </form>
                </div>
            </dialog>
        </div>
    )

}

const serializeFriends = async (docSnapshots: QueryDocumentSnapshot[]) => {
    return (await Promise.all(docSnapshots.map(async (snapshot)=>{
        const data = snapshot.data()
        const userDocRef = doc(db, 'users', data.from)
        const userDocSnapshot = await getDoc(userDocRef)
        if(!userDocSnapshot.exists()) return null
        const userData = userDocSnapshot.data()
        return {
            relationshipId: snapshot.id,
            friendId: data.from,
            username: userData.username,
            isOnline: userData.isOnline
        }
    }))).filter((f)=>f !== null)
}


export default FriendList