import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface SelectorAccessCode {
    code: string;
    partnerId: string;
    expirationDateTime: Timestamp;
}
