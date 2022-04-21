import {firestore} from "firebase-admin";
import FieldValue = firestore.FieldValue;

export interface PromotionCode {
    code: string;
    amountOff: number;
    currency: string;
    expirationDateTime: FieldValue,
    isValid: boolean,
    maxRedemptions: number;
    timesRedeemed: number;
}