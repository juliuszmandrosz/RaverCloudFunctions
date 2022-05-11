import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { vipPaymentSessions } from '../../constants/collections';
import { cancelUsersPaymentSessionsQueryBatch } from './cancel-users-payment-sessions-query-batch';
import { VipPaymentSession } from '../../models/vip-payment-session';

export async function cancelUsersVipPaymentSessions(eventId: string): Promise<void> {
    const query = firestoreDatabase()
        .collection(vipPaymentSessions)
        .where('eventId', '==', eventId)
        .where('status', 'in', ['requires_payment_method', 'requires_action']);

    await cancelUsersPaymentSessionsQueryBatch(query.limit(500), {
        status: 'canceled',
    } as VipPaymentSession);
}
