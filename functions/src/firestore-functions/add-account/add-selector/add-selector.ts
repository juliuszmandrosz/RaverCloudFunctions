import * as functions from 'firebase-functions';
import { AddSelectorRequest } from './add-selector-request';
import { firestoreDatabase } from '../../../modules/firebase-admin-module';
import { selectors } from '../../../constants/collections';
import { Selector } from '../../../models/selector';
import { setSelectorClaim } from '../../../auth-functions/set-claim/set-selector-claim';
import { useSelectorAccessCode } from '../../use-selector-access-code/use-selector-access-code';
import { throwUnauthenticatedError } from '../../../errors/throw-unauthenticated-error';

export async function addSelector(
    data: AddSelectorRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const accessCode = data?.accessCode;

    if (!accessCode) {
        const message = 'The function must be called with access code.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const accessCodeData = await useSelectorAccessCode({ accessCode }, context);

    const selectorId = context.auth!.uid;
    const selectorEmail = context.auth!.token.email!;

    const selectorDocRef = firestoreDatabase().collection(selectors).doc(selectorId);
    const selectorDoc = await selectorDocRef.get();

    if (selectorDoc.exists) {
        const message = 'Selector with given id already exists';
        throw new functions.https.HttpsError('already-exists', message);
    }

    const selector: Selector = { clubId: accessCodeData.partnerId, email: selectorEmail };

    await selectorDocRef.set(selector);

    await setSelectorClaim({ email: selectorEmail });
}
