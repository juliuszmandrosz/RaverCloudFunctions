import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface Payout {
    amount: number;
    currency: string;
    payoutDateTime: Timestamp;
}
