type ConversationHeaderProps = {
    isDirect: boolean,
    isOnline: boolean,
    name: string,
    src: string
}
const ConversationHeader = ({isDirect, src, name, isOnline}: ConversationHeaderProps) => {
    return (
        <div className='border-b-1 border-gray-700 flex justify-start items-center p-2'>
            <div className={`avatar 
            ${isDirect && (isOnline ? 'avatar-online' : 'avatar-offline')}`}>
            <div className="w-6 rounded-full">
                <img src={src} />
            </div>
            </div>
            <div className='ml-2 text-white'>{name}</div>
        </div>
    )

}

export default ConversationHeader