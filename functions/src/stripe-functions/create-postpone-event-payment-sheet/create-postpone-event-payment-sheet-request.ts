import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface CreatePostponeEventPaymentSheetRequest {
    eventId: string;
    newEventStartDateTime: Timestamp;
    newEventEndDateTime: Timestamp;
}
