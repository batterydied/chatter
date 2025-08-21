import { RequestIcon } from "../../../assets/icons"
type FriendRequestBtnProps = {
    count: number,
    onClick: () => void
}

const serializedBadge = (count: number) => {
    if(count > 99) return '+99'
    return `${count}`
} 

const FriendRequestBtn = ({count, onClick} : FriendRequestBtnProps) => {
    return (
        <button className='group btn justify-start w-full border-0 shadow-none bg-base-100 hover:bg-base-300 text-gray-400 hover:text-white' onClick={onClick}>
            <div className='w-full flex justify-between items-center'>
                <div className='flex'>
                    <RequestIcon className='text-gray-400 group-hover:text-white mr-2'/>
                    Requests
                </div>
                {count > 0 && <div className="badge badge-sm badge-secondary">{serializedBadge(count)}</div>}
            </div>
        </button>
    )
}

export default FriendRequestBtn