import { renderFriends } from "../homePageHelpers"
import type { Friend } from '../homePageHelpers'
type FriendProps = {
    friends: Friend[]
}
const FriendList = ({friends}: FriendProps) => {
    return (
        <ul className='list bg-base-100 rounded-box shadow-md'>
            {renderFriends(friends)}
        </ul>
    )

}

export default FriendList