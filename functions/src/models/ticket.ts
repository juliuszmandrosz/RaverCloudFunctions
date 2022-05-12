import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export interface Ticket {
    id: string;
    eventId: string;
    clubId: string;
    ticketPaymentId: string;
    clubName: string;
    eventName: string;
    eventDateTime: Timestamp;
    price: number;
    currency: string;
    isVip: boolean;
    isExpired: boolean;
    isEventCanceled: boolean;
    isReturnable: boolean;
    vipPaymentId?: string;
}
