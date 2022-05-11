import { FunctionsErrorDetails } from './functions-error-details';
import * as functions from 'firebase-functions';

export function throwEventCanceledError() {
    const message = 'Event has been canceled';
    const details: FunctionsErrorDetails = 'event-canceled';
    throw new functions.https.HttpsError('resource-exhausted', message, details);
}
