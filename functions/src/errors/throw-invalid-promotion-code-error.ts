import {FunctionsErrorDetails} from "./functions-error-details";
import * as functions from "firebase-functions";

export function throwInvalidPromotionCodeError() {
    const message = 'Promotion code does not exists';
    const details: FunctionsErrorDetails = 'invalid-promotion-code';
    throw new functions.https.HttpsError('not-found', message, details);
}