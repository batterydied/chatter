import type { RawMessage } from "../pages/HomePage/components/ConversationWindow";
import { toDateSafe } from "./toDateSafe";

const serializeMessages = async (rawMessages: RawMessage[]) => {
    return await Promise.all(
        rawMessages.map((m) => {
        return {
            id: m.id,
            text: m.text,
            senderId: m.senderId,
            createdAt: toDateSafe(m.createdAt),
            isEdited: m.isEdited,
            isReply: m.isReply,
            replyId: m.replyId,
            reactions: m.reactions,
            databaseFiles: m.databaseFiles
        };
        })
    );
}

export default serializeMessages

