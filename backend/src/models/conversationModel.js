import { z } from 'zod'

const ConversationSchema = z.object({
    participants: z.array(z.string()),
    hiddenBy: z.array(z.string()).default([]),
    mutedBy: z.array(z.string()).default([]),
    createdAt: z.any(),
    lastUpdated: z.any().optional()
})

export default ConversationSchema