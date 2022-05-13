import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { vipPaymentSessions } from '../../constants/collections';
import { getVipPaymentSessionResult } from '../get-data/get-vip-payment-session.data';

export async function getVipPaymentSessionsFromEvent(eventId: string) {
    const vipSessionsData = await firestoreDatabase()
        .collection(vipPaymentSessions)
        .where('status', '==', 'succeeded')
        .where('eventId', '==', eventId)
        .where('isRefunded', '==', false)
        .get();

    return vipSessionsData.docs.map((doc) => getVipPaymentSessionResult(doc, doc.id));
}
