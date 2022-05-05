import * as functions from 'firebase-functions';
import { UseSelectorAccessCodeRequest } from './use-selector-access-code-request';
import { getAccessCodeDocRef, tryGetAccessCodeData } from '../get-data/get-access-code-data';
import { Selector } from '../../models/selector';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { partners, selectors } from '../../constants/collections';
import { SelectorAccessCode } from '../../models/selector-access-code';

export async function useSelectorAccessCode(
    data: UseSelectorAccessCodeRequest,
    context: functions.https.CallableContext
): Promise<SelectorAccessCode> {
    if (!context.auth) {
        const message = 'The function must be called while authenticated.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }

    const accessCode = data?.accessCode;

    if (!accessCode) {
        const message = 'The function must be called with access code.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const accessCodeData = await tryGetAccessCodeData(accessCode);

    const selectorEmail = context.auth.token.email!;
    const selectorId = context.auth.uid;
    const selector: Selector = { email: selectorEmail };

    const partnerDocRef = firestoreDatabase().collection(partners).doc(accessCodeData.partnerId);
    await partnerDocRef.collection(selectors).doc(selectorId).set(selector);

    await removeAccessCode(accessCode);

    return accessCodeData;
}

async function removeAccessCode(accessCode: string) {
    await getAccessCodeDocRef(accessCode).delete();
}
