import { type Conversation } from "../homePageHelpers"
import { getPfpByFilePath } from "../../../utils/getPfp"
import { useHeaderContext } from "../../../hooks/useHeaderContext"

type ConversationHeaderProps = {
    conversation : Conversation,
}
const ConversationHeader = ({conversation}: ConversationHeaderProps) => {
    const headerData = useHeaderContext()
    return (
        <div className='border-b-1 border-gray-700 flex justify-start items-center p-2'>
            <div className={`avatar 
            ${conversation.directConversationId && (headerData?.displayIsOnline ? 'avatar-online' : 'avatar-offline')}`}>
            <div className="w-6 rounded-full">
                <img src={getPfpByFilePath(headerData ? headerData.displayPfpFilePath : conversation.pfpFilePath)} />
            </div>
            </div>
            <div className='ml-2'>{headerData ? headerData.displayName : conversation.name}</div>
        </div>
    )

}

export default ConversationHeader