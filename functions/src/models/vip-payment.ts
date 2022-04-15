import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface VipPayment {
    id: string;
    paymentIntentId: string;
    transferId: string;
    eventId: string;
    paymentDateTime: Timestamp;
    price: number;
    currency: string;
    promotionCode?: string;
}