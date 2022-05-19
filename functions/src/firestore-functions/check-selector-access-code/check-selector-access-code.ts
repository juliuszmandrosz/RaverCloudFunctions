import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { CheckSelectorAccessCodeRequest } from './check-selector-access-code-request';
import { tryGetSelectorAccessCodeData } from '../get-data/get-selector-access-code-data';
import { throwInvalidAccessCodeError } from '../../errors/throw-invalid-access-code-error';

export async function checkSelectorAccessCode(
    data: CheckSelectorAccessCodeRequest,
    _: functions.https.CallableContext
): Promise<void> {
    const accessCode = data?.accessCode;

    if (!accessCode) {
        const message = 'The function must be called with access code.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const accessCodeData = await tryGetSelectorAccessCodeData(accessCode);

    if (Timestamp.now().toMillis() >= accessCodeData.expirationDateTime.toMillis()) {
        throwInvalidAccessCodeError();
    }
}
