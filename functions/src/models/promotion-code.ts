import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export interface PromotionCode {
    code: string;
    amountOff: number;
    currency: string;
    expirationDateTime: Timestamp,
    isValid: boolean,
    maxRedemptions: number;
    timesRedeemed: number;
}