import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { cancelEventPaymentSessions } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { CancelEventPaymentSession } from '../../models/cancel-event-payment-session';

const errorMessage = 'Cancel event payment session with given id does not exists';

export async function tryGetCancelEventPaymentSessionData(
    cancelEventPaymentSessionId: string,
    transaction?: Transaction
) {
    const cancelEventPaymentDoc = await getCancelEventPaymentSessionDoc(
        cancelEventPaymentSessionId,
        transaction
    );

    if (!cancelEventPaymentDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return getCancelEventPaymentSessionData(cancelEventPaymentDoc, cancelEventPaymentSessionId);
}

export async function getCancelEventPaymentSessionDataOrReturnNotFound(
    cancelEventPaymentSessionId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const cancelEventPaymentDoc = await getCancelEventPaymentSessionDoc(
        cancelEventPaymentSessionId,
        transaction
    );

    if (!cancelEventPaymentDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return getCancelEventPaymentSessionData(cancelEventPaymentDoc, cancelEventPaymentSessionId);
}

export async function getCancelEventPaymentSessionDataOrUndefined(
    cancelEventPaymentSessionId: string,
    transaction?: Transaction
) {
    const cancelEventPaymentDoc = await getCancelEventPaymentSessionDoc(
        cancelEventPaymentSessionId,
        transaction
    );

    if (!cancelEventPaymentDoc.exists) {
        return;
    }

    return getCancelEventPaymentSessionData(cancelEventPaymentDoc, cancelEventPaymentSessionId);
}

export function getCancelEventPaymentSessionDocRef(cancelEventPaymentSessionId: string) {
    return firestoreDatabase()
        .collection(cancelEventPaymentSessions)
        .doc(cancelEventPaymentSessionId);
}

async function getCancelEventPaymentSessionDoc(
    cancelEventPaymentSessionId: string,
    transaction?: Transaction
) {
    const cancelEventPaymentSessionDocRef = getCancelEventPaymentSessionDocRef(
        cancelEventPaymentSessionId
    );
    return transaction
        ? transaction.get(cancelEventPaymentSessionDocRef)
        : cancelEventPaymentSessionDocRef.get();
}

function getCancelEventPaymentSessionData(
    cancelEventPaymentSessionDoc: DocumentSnapshot,
    cancelEventPaymentSessionId: string
) {
    const cancelEventPaymentSession =
        cancelEventPaymentSessionDoc.data() as CancelEventPaymentSession;
    cancelEventPaymentSession.id = cancelEventPaymentSessionId;

    return cancelEventPaymentSession;
}
