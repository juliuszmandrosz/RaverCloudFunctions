import * as functions from "firebase-functions";
import {FunctionsErrorDetails} from "./functions-error-details";

export function throwInvalidEventError() {
    const message = 'Event with given id does not exists.';
    const details: FunctionsErrorDetails = 'invalid-event';
    throw new functions.https.HttpsError('not-found', message, details);
}