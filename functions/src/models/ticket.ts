import {firestore} from "firebase-admin";
import FieldValue = firestore.FieldValue;

export interface Ticket {
    id: string;
    eventId: string;
    ticketPaymentId: string;
    clubName: string;
    eventName: string;
    eventDateTime: FieldValue;
    price: number;
    currency: string;
    isVip: boolean;
    isExpired: boolean;
}