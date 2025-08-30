import { useHomePageContext } from "../../../hooks/useHomePageContext"
import Modal from "./Modal"

type AddFriendModalProps = {
    handleCloseRequest: () => void,
    errorMessage: string,
    successRequestMessage: boolean,
    setSearchId: (id: string) => void,
    searchId: string,
    handleSend: () => Promise<void>,
    isOpen: boolean
}

const isValidSearchId = (searchId: string) => {
    return searchId.length === 20
}

const AddFriendModal = ({isOpen, handleCloseRequest, setSearchId, searchId, handleSend, successRequestMessage, errorMessage}: AddFriendModalProps) => {
    const user = useHomePageContext()
    return (
        <Modal isOpen={isOpen} onClose={handleCloseRequest}>
            <div className='flex flex-col'>

            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" 
                onClick={handleCloseRequest}>✕</button>
            <div className='p-8'>
                <h3 className="font-bold text-lg">Add Friend</h3>
                <div>Your friend ID: {user.id}</div>
            </div>
            <div className='w-full p-8'>
                <div className='w-full flex justify-center'>
                    <input type="text" onChange={(e)=>setSearchId(e.target.value)} value={searchId} placeholder="Enter user ID: " className="input my-2"/>
                </div>
                <div className='w-full flex justify-center'>
                    <button onClick={handleSend} className={`btn btn-primary ${!isValidSearchId(searchId) && 'pointer-events-none opacity-50'}`}>Send Friend Request</button>
                </div>
                {successRequestMessage && <div className='text-green-400 m-2'>Friend request sent successfully!</div>}
                {errorMessage && <div className='text-red-400 m-2'>{errorMessage}</div>}
            </div>
            </div>
        </Modal>
    )
}

export default AddFriendModal