import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface CreateUpdateClubSalesOnEventEndParams {
    eventId: string;
    clubId: string;
    executesAt: Timestamp;
}
