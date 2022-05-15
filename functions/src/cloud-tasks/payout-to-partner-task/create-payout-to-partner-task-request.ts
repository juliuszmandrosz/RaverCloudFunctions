import { Event } from '../../models/event';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface CreatePayoutToPartnerTaskRequest {
    event: Event;
    /// If not provided, event end date time will be used
    executesAt?: Timestamp;
}
