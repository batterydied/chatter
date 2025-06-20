import { z } from 'zod'

const ConversationSchema = z.object({
    participants: z.array(z.string()),
    hiddenBy: z.array(z.string()).default([]),
    mutedBy: z.array(z.string()).default([]),
    createdAt: z.string().datetime(),
    lastUpdated: z.string().datetime().optional()
})

export default ConversationSchema