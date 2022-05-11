import { FunctionsErrorDetails } from './functions-error-details';
import * as functions from 'firebase-functions';

export function throwEventPostponedError() {
    const message = 'Event has been postponed';
    const details: FunctionsErrorDetails = 'event-postponed';
    throw new functions.https.HttpsError('resource-exhausted', message, details);
}
