import { z } from 'zod'

const ConversationSchema = z.object({
    participants: z.array(z.string()),
    hiddenBy: z.array(z.string()).default([]),
    mutedBy: z.array(z.string()).default([]),
    createdAt: z.any().optional(),
    lastMessageTime: z.any().optional(),
    name: z.string().default(''),
    hiddenBy: z.array(z.string()),
    directConversationId: z.string()
})

export default ConversationSchema