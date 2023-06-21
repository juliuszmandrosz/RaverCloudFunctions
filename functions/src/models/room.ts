interface Room {
    id: string;
    roomName: string;
    roomPhotoUrl: string;
    participantIds: string[];
    lastMessageId?: string;
    lastMessageText?: string;
    lastMessageUsername?: string;
    lastMessageCreatedAt?: Date;
    isLastMessageLeftInfo: boolean;
    isLastMessageJoinedInfo: boolean;
}
