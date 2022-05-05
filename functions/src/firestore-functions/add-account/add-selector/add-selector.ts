import * as functions from 'firebase-functions';
import { AddSelectorRequest } from './add-selector-request';
import { firestoreDatabase } from '../../../modules/firebase-admin-module';
import { selectors } from '../../../constants/collections';
import { Selector } from '../../../models/selector';
import { setSelectorClaim } from '../../../auth-functions/set-claim/set-selector-claim';
import { useSelectorAccessCode } from '../../use-selector-access-code/use-selector-access-code';

export async function addSelector(
    data: AddSelectorRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        const message = 'The function must be called while authenticated.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }

    const selectorEmail = data?.email;
    const accessCode = data?.accessCode;

    if (!selectorEmail) {
        const message = 'The function must be called with selector email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!accessCode) {
        const message = 'The function must be called with access code.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const accessCodeData = await useSelectorAccessCode({ accessCode }, context);

    const selectorId = context.auth.uid;
    const selector: Selector = { clubId: accessCodeData.partnerId, email: selectorEmail };

    await firestoreDatabase().collection(selectors).doc(selectorId).set(selector);

    await setSelectorClaim({ email: selectorEmail });
}
