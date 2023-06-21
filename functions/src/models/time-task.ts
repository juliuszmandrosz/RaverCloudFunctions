import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface TimeTask {
    id: string;
    eventId: string;
    eventName: string;
    createdAt: Timestamp;
    durationInMinutes: number;
    timeTaskName: string;
    voucherName: string;
    descriptionPl: string;
    descriptionEn: string;
    poolLimit: number;
    currentUsage: number;
}
