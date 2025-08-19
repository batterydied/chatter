import type { SerializedMessage } from "./ConversationWindow"


type DeleteMessageProps = {
    deleteMessage: SerializedMessage | null,
    username: string,
    setDeleteMessage: (msg: SerializedMessage | null) => void,
    sendDelete: (msgId: string) => void
}

const DeleteMessageModal = ({deleteMessage, username, sendDelete, setDeleteMessage} : DeleteMessageProps) => {
    return (
        <dialog id="delete_confirmation_modal" className="modal">
            <div className="modal-box">
            <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <div className='absolute bottom-2 right-4'>
                <button className="btn btn-sm bg-gray-500 mr-2 hover:!border-gray-500 hover:bg-gray-600" onClick={()=>setDeleteMessage(null)}>Cancel</button>
                <button className="btn btn-sm bg-red-500 hover:!border-red-500 hover:bg-red-600" onClick={()=>sendDelete(deleteMessage!.id)}>Delete</button>
                </div>
            </form>
            <h3 className="font-bold text-lg">Delete Message</h3>
            <h3 className="text-md">Are you sure you want to delete this message?</h3>
            <div className='chat chat-end bg-base-100 p-2 m-6 rounded-md'>
                <div className="chat-header">
                    {username}
                    <time className="text-xs opacity-50 ml-2">{deleteMessage?.messageTime}</time>
                </div>
                <div className={`chat-bubble mt-3`}>
                    {deleteMessage && deleteMessage.text.length > 500 ? deleteMessage.text.slice(0, 500) + '...' : deleteMessage?.text}
                    {deleteMessage?.isEdited && <span className='absolute bottom-0 right-full px-2 text-xs text-gray-300'>(edited)</span>}
                </div>
            </div>
            </div>
      </dialog>
    )
}

export default DeleteMessageModal