import { z } from 'zod'

const UserSchema = z.object({
    username: z.string(),
    email: z.string().email(),
    createdAt: z.any().optional(),
    isOnline: z.boolean().default(true),
    tabsOpened: z.number().default(0)
})

export default UserSchema