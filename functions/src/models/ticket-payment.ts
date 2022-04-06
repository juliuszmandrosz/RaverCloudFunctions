import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface TicketPayment {
    id: string;
    paymentIntentId: string;
    transferId: string;
    eventId: string;
    eventDateTime: Timestamp,
    paymentDateTime: Timestamp;
    price: number;
    currency: string;
    isVip: boolean;
    promotionCode?: string;
}