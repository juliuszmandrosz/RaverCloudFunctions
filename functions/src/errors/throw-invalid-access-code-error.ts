import { FunctionsErrorDetails } from './functions-error-details';
import * as functions from 'firebase-functions';

export function throwInvalidAccessCodeError() {
    const message = 'Access code does not exists or has expired';
    const details: FunctionsErrorDetails = 'invalid-access-code';
    throw new functions.https.HttpsError('resource-exhausted', message, details);
}
