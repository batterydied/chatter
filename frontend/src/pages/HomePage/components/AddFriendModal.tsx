import { useHomePageContext } from "../../../hooks/useHomePageContext"

type AddFriendModalProps = {
    handleCloseRequest: () => void,
    errorMessage: string,
    successRequestMessage: boolean,
    setSearchId: (id: string) => void,
    searchId: string,
    handleSend: () => Promise<void>
}

const isValidSearchId = (searchId: string) => {
    return searchId.length === 20
}

const AddFriendModal = ({handleCloseRequest, setSearchId, searchId, handleSend, successRequestMessage, errorMessage}: AddFriendModalProps) => {
    const user = useHomePageContext()
    return (
        <dialog id="add_friend_modal" className="modal" onClose={handleCloseRequest}>
            <div className="modal-box">
                <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" 
                    onClick={handleCloseRequest}>✕</button>
                <h3 className="font-bold text-lg">Add Friend</h3>
                <div>Your friend ID: {user.id}</div>
                <input type="text" onChange={(e)=>setSearchId(e.target.value)} value={searchId} placeholder="Enter user ID: " className="input my-2"/>
                </form>
                <button onClick={handleSend} className={`btn btn-primary ${!isValidSearchId(searchId) && 'pointer-events-none opacity-50'}`}>Send Friend Request</button>
                {successRequestMessage && <div className='text-green-400 m-2'>Friend request sent successfully!</div>}
                {errorMessage && <div className='text-red-400 m-2'>{errorMessage}</div>}
            </div>
        </dialog>
    )
}

export default AddFriendModal