type Reaction = {
    user: string,
    emoji: string,
}

type ReactionsProps = {
    reactions: Reaction[],
    appUserId: string
}

type SerializedReaction = {
    count: number,
    emoji: string,
    users: string[]
}

export const Reactions = ({reactions, appUserId}: ReactionsProps) => {
    console.log(reactions)
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

    const handleIncrement = (emoji: string, appUserId: string) => {
        console.log(emoji, appUserId)
    }

    const handleDecrement = (emoji: string, appUserId: string) => {
        console.log(emoji, appUserId)
    }

    return (
        <ul className='flex'>
            {serializedReactions.map(([key, data])=>{
                const reactedByAppUser = data.users.some((id) => id === appUserId)
                return (
                    <li key={key} onClick={reactedByAppUser ? ()=>handleDecrement(key, appUserId) : ()=>handleIncrement(key, appUserId)} className={`hover:cursor-pointer px-1 border-1 ${reactedByAppUser ? 'hover:bg-blue-800 bg-blue-900 border-blue-600': 'hover:bg-gray-800 bg-gray-900 border-gray-600'} rounded-md`}>
                        {key} {data.count > 1 && data.count}
                    </li>
                )
            })}
        </ul>
    )
}