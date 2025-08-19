import type { Friend } from "./FriendList"

type RemoveFriendConfirmationModalProps = {
    removeFriend: Friend | null,
    setRemoveFriend: (friend: Friend | null) => void,
    sendRemove: (id: string) => Promise<void>
}
const RemoveFriendConfirmationModal = ({removeFriend, setRemoveFriend, sendRemove}: RemoveFriendConfirmationModalProps) => {
    return (
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
    )

}

export default RemoveFriendConfirmationModal