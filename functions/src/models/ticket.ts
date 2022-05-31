import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface Ticket {
    id: string;
    eventId: string;
    clubId: string;
    ticketPaymentId: string;
    clubName: string;
    eventName: string;
    eventStartDateTime: Timestamp;
    eventEndDateTime: Timestamp;
    price: number;
    currency: string;
    isVip: boolean;
    isExpired: boolean;
    isEventCanceled: boolean;
    isReturnable: boolean;
    isReturned: boolean;
    reviewId?: string;
    vipPaymentId?: string;
}
