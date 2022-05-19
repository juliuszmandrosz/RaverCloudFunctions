import * as functions from 'firebase-functions';
import {firestore} from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import {throwInvalidAccessCodeError} from '../../errors/throw-invalid-access-code-error';
import {CheckPartnerAccessCodeRequest} from "./check-partner-access-code-request";
import {tryGetPartnerAccessCodeData} from "../get-data/get-partner-access-code-data";

export async function checkPartnerAccessCode(
    data: CheckPartnerAccessCodeRequest,
    _: functions.https.CallableContext
): Promise<void> {
    const accessCode = data?.accessCode;

    if (!accessCode) {
        const message = 'The function must be called with access code.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const accessCodeData = await tryGetPartnerAccessCodeData(accessCode);

    if (Timestamp.now().toMillis() >= accessCodeData.expirationDateTime.toMillis()) {
        throwInvalidAccessCodeError();
    }
}
