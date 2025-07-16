import { z } from 'zod'

const UserSchema = z.object({
    username: z.string(),
    email: z.string().email(),
    createdAt: z.any().optional(),
    uid: z.string()
})

export default UserSchema