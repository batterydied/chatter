import { z } from 'zod'

const MessageSchema = z.object({
    senderId: z.string(),
    type: z.enum(['text', 'image', 'file', 'video']),
    text: z.string().optional(),
    fileUrl: z.string().url().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional()
});

export default MessageSchema