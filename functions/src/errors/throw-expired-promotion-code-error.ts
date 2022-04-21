import {FunctionsErrorDetails} from "./functions-error-details";
import * as functions from "firebase-functions";

export function throwExpiredPromotionCodeError() {
    const message = 'Promotion code has expired';
    const details: FunctionsErrorDetails = 'expired-promotion-code';
    throw new functions.https.HttpsError('resource-exhausted', message, details);
}