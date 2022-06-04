import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface AppliedDiscount {
    id: string;
    eventId: number;
    realizationDateTime: Timestamp;
}
