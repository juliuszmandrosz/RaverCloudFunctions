import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventCostsDocRef, tryGetEventCostsData } from '../get-data/get-event-costs-data';
import { getUserFee } from '../../utils/stripe-utils/get-user-fee';
import { tryGetTicketPaymentSessionData } from '../get-data/get-ticket-payment-session-data';
import { tryGetVipPaymentSession } from '../get-data/get-vip-payment-session.data';

export interface UpdateEventCostsOnTicketReturnParams {
    eventId: string;
    clubId: string;
    ticketPaymentSessionId: string;
    vipPaymentSessionId?: string;
}

export async function updateEventCostsOnTicketReturn(
    params: UpdateEventCostsOnTicketReturnParams
): Promise<void> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventCostsDocRef = getEventCostsDocRef(params.clubId, params.eventId);
        const eventCosts = await tryGetEventCostsData(params.clubId, params.eventId);

        const ticketPaymentSession = await tryGetTicketPaymentSessionData(
            params.ticketPaymentSessionId
        );

        const ticketFee = await getUserFee(ticketPaymentSession.amount, eventCosts.currency);

        let vipFee = 0;

        if (params.vipPaymentSessionId) {
            const vipPaymentSession = await tryGetVipPaymentSession(params.vipPaymentSessionId);
            vipFee = await getUserFee(vipPaymentSession.amount, eventCosts.currency);
        }

        eventCosts.eventPostponeBalance -= ticketFee;
        eventCosts.eventPostponeBalance -= vipFee;

        transaction.update(eventCostsDocRef, eventCosts);
    });
}
