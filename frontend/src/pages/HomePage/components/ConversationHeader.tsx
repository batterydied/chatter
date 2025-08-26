import { type Conversation } from "../homePageHelpers"
import { getPfpByFilePath } from "../../../utils/getPfp"

type ConversationHeaderProps = {
    conversation : Conversation
}
const ConversationHeader = ({conversation}: ConversationHeaderProps) => {
    return (
        <div className='border-b-1 border-gray-700 flex justify-start items-center p-2'>
            <div className={`avatar 
            ${conversation.directConversationId && (conversation.isOnline ? 'avatar-online' : 'avatar-offline')}`}>
            <div className="w-6 rounded-full">
                <img src={getPfpByFilePath(conversation.pfpFilePath)} />
            </div>
            </div>
            <div className='ml-2 text-white'>{conversation.name}</div>
        </div>
    )

}

export default ConversationHeader