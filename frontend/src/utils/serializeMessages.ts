import type { RawMessage } from "../pages/HomePage/components/ConversationWindow";
import formatMessageTime from "./formatMessageTime";

const serializeMessages = async (rawMessages: RawMessage[]) => {
    return await Promise.all(
        rawMessages.map((m) => {
        const timestamp = typeof m.createdAt === 'string' ? new Date(m.createdAt) : m.createdAt.toDate()
        const messageTime = formatMessageTime(timestamp)
        return {
            id: m.id,
            text: m.text,
            messageTime,
            senderId: m.senderId,
            timestamp,
            isEdited: m.isEdited,
            isReply: m.isReply,
            replyId: m.replyId,
            reactions: m.reactions,
        };
        })
    );
}

export default serializeMessages

