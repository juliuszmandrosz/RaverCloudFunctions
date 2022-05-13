import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { postponeEventPaymentSessions } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { PostponeEventPaymentSession } from '../../models/postpone-event-payment-session';

const errorMessage = 'Postpone event payment session with given id does not exists';

export async function tryGetPostponeEventPaymentSessionData(
    postponeEventPaymentSessionId: string,
    transaction?: Transaction
) {
    const postponeEventPaymentDoc = await getPostponeEventPaymentSessionDoc(
        postponeEventPaymentSessionId,
        transaction
    );

    if (!postponeEventPaymentDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return getPostponeEventPaymentSessionData(
        postponeEventPaymentDoc,
        postponeEventPaymentSessionId
    );
}

export async function getPostponeEventPaymentSessionDataOrReturnNotFound(
    postponeEventPaymentSessionId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const PostponeEventPaymentDoc = await getPostponeEventPaymentSessionDoc(
        postponeEventPaymentSessionId,
        transaction
    );

    if (!PostponeEventPaymentDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return getPostponeEventPaymentSessionData(
        PostponeEventPaymentDoc,
        postponeEventPaymentSessionId
    );
}

export async function getPostponeEventPaymentSessionDataOrUndefined(
    postponeEventPaymentSessionId: string,
    transaction?: Transaction
) {
    const postponeEventPaymentDoc = await getPostponeEventPaymentSessionDoc(
        postponeEventPaymentSessionId,
        transaction
    );

    if (!postponeEventPaymentDoc.exists) {
        return;
    }

    return getPostponeEventPaymentSessionData(
        postponeEventPaymentDoc,
        postponeEventPaymentSessionId
    );
}

export function getPostponeEventPaymentSessionDocRef(postponeEventPaymentSessionId: string) {
    return firestoreDatabase()
        .collection(postponeEventPaymentSessions)
        .doc(postponeEventPaymentSessionId);
}

async function getPostponeEventPaymentSessionDoc(
    postponeEventPaymentSessionId: string,
    transaction?: Transaction
) {
    const postponeEventPaymentSessionDocRef = getPostponeEventPaymentSessionDocRef(
        postponeEventPaymentSessionId
    );
    return transaction
        ? transaction.get(postponeEventPaymentSessionDocRef)
        : postponeEventPaymentSessionDocRef.get();
}

function getPostponeEventPaymentSessionData(
    postponeEventPaymentSessionDoc: DocumentSnapshot,
    postponeEventPaymentSessionId: string
) {
    const postponeEventPaymentSession =
        postponeEventPaymentSessionDoc.data() as PostponeEventPaymentSession;

    postponeEventPaymentSession.id = postponeEventPaymentSessionId;

    return postponeEventPaymentSession;
}
