import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { vipPaymentSessions } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { VipPaymentSession } from '../../models/vip-payment-session';

const errorMessage = 'Vip payment session with given id does not exists';

export async function tryGetVipPaymentSession(
    vipPaymentSessionId: string,
    transaction?: Transaction
) {
    const vipPaymentSessionDoc = await getVipPaymentSessionDoc(vipPaymentSessionId, transaction);

    if (!vipPaymentSessionDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return getVipPaymentSessionResult(vipPaymentSessionDoc, vipPaymentSessionId);
}

export async function getVipPaymentSessionDataOrUndefined(
    vipPaymentSessionId: string,
    transaction?: Transaction
) {
    const vipPaymentSessionDoc = await getVipPaymentSessionDoc(vipPaymentSessionId, transaction);

    if (!vipPaymentSessionDoc.exists) {
        return;
    }

    return getVipPaymentSessionResult(vipPaymentSessionDoc, vipPaymentSessionId);
}

export async function getVipPaymentSessionDataOrReturnNotFound(
    vipPaymentSessionId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const vipPaymentSessionDoc = await getVipPaymentSessionDoc(vipPaymentSessionId, transaction);

    if (!vipPaymentSessionDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return getVipPaymentSessionResult(vipPaymentSessionDoc, vipPaymentSessionId);
}

export function getVipPaymentSessionDocRef(vipPaymentSessionId: string) {
    return firestoreDatabase().collection(vipPaymentSessions).doc(vipPaymentSessionId);
}

export function getVipPaymentSessionResult(
    vipPaymentSessionDoc: DocumentSnapshot,
    vipPaymentSessionId: string
) {
    const vipPaymentSession = vipPaymentSessionDoc.data() as VipPaymentSession;
    vipPaymentSession.id = vipPaymentSessionId;

    return vipPaymentSession;
}

async function getVipPaymentSessionDoc(vipPaymentSessionId: string, transaction?: Transaction) {
    const vipPaymentSessionDocRef = getVipPaymentSessionDocRef(vipPaymentSessionId);
    return transaction ? transaction.get(vipPaymentSessionDocRef) : vipPaymentSessionDocRef.get();
}
