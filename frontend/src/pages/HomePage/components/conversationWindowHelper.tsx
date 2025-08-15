export type Reaction = {
    user: string,
    emoji: string,
}

type ReactionsProps = {
    reactions: Reaction[],
    msgId: string,
    appUserId: string,
    handleIncrement: (emoji: string, msgId: string) => void,
    handleDecrement: (emoji: string, msgId: string) => void
}

type SerializedReaction = {
    count: number,
    emoji: string,
    users: string[]
}

export type SerializedMessage = {
  id: string
  text: string
  username: string
  messageTime: string,
  senderId: string,
  timestamp: Date,
  isEdited: boolean,
  isReply: boolean,
  replyId: string,
  reactions: {
    user: string
    emoji: string,
  }[]
}

export const Reactions = ({msgId, reactions, appUserId, handleIncrement, handleDecrement}: ReactionsProps) => {
    const serializeReactions = (reactions: Reaction[]) => {
        const serializedReactions: Record<string, SerializedReaction> = {}

        for(const reaction of reactions){
            const emoji = reaction.emoji
            if(!serializedReactions[emoji]){
                serializedReactions[emoji] = {emoji, count: 1, users: [reaction.user]}
            }else{
                serializedReactions[emoji].count += 1
                serializedReactions[reaction.emoji].users.push(reaction.user)
            }
        }

        return Object.entries(serializedReactions)

    }
    const serializedReactions = serializeReactions(reactions)

    return (
        <ul className='flex justify-end'>
            {serializedReactions.map(([key, data])=>{
                const reactedByAppUser = data.users.some((id) => id === appUserId)
                return (
                    <li key={key} onClick={reactedByAppUser ? ()=>handleDecrement(key, msgId) : ()=>handleIncrement(key, msgId)} className={`hover:cursor-pointer px-1 border-1 ${reactedByAppUser ? 'hover:bg-blue-800 bg-blue-900 border-blue-600': 'hover:bg-gray-800 bg-gray-900 border-gray-600'} rounded-md`}>
                        {key} {data.count > 1 && data.count}
                    </li>
                )
            })}
        </ul>
    )
}