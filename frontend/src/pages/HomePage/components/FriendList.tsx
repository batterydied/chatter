import { renderFriends } from "../homePageHelpers"
type FriendProps = {
    friends: Friend[]
}

export type Friend = {
    status: string
    userId: string
    username: string
}

const FriendList = ({friends}: FriendProps) => {
    return (
        <ul className='list bg-base-100 rounded-box shadow-md'>
            {renderFriends(friends)}
        </ul>
    )

}

export default FriendList