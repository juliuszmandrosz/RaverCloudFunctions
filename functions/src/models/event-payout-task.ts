import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface EventPayoutTask {
    /// Event id
    id: string;
    payoutTaskId: string;
    executesAt: Timestamp;
}
