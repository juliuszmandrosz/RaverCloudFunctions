import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface Payout {
    /// Amount in the smallest currency unit
    amount: number;
    currency: string;
    payoutDateTime: Timestamp;
}
