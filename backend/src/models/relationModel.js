import { z } from 'zod'

const RelationSchema = z.object({
    from: z.string(),
    to: z.string(),
    status: z.string(),
    createdAt: z.any().optional(),
})

export default RelationSchema