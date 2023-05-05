import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface Message {
    readonly id: string;
    readonly userId: string;
    readonly username: string;
    readonly text: string;
    readonly createdAt: Timestamp;
    readonly userPictureUrl?: string;
    readonly isJoinedInfo: boolean;
    readonly isLeftInfo: boolean;
    readonly isUserDeleted: boolean;
}
