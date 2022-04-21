import {firestore} from "firebase-admin";
import FieldValue = firestore.FieldValue;

export interface TicketPayment {
    id: string;
    paymentIntentId: string;
    eventId: string;
    price: number;
    currency: string;
    eventName: string;
    clubName: string;
    paymentDateTime: FieldValue;
    eventDateTime: FieldValue;
    isVip: boolean;
    promotionCode?: string;
}