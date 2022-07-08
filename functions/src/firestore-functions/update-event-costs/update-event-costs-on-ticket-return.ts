import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventCostsDocRef, tryGetEventCostsData } from '../get-data/get-event-costs-data';
import { tryGetTicketPaymentSessionData } from '../get-data/get-ticket-payment-session-data';
import { tryGetVipPaymentSession } from '../get-data/get-vip-payment-session.data';
import { toJson } from '../../utils/json-utils';

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

        const ticketFee = ticketPaymentSession.serviceFeeAmount;

        let vipFee = 0;

        if (params.vipPaymentSessionId) {
            const vipPaymentSession = await tryGetVipPaymentSession(params.vipPaymentSessionId);
            vipFee = vipPaymentSession.serviceFeeAmount;
        }

        eventCosts.eventPostponeBalance -= ticketFee;
        eventCosts.eventPostponeBalance -= vipFee;

        transaction.update(eventCostsDocRef, toJson(eventCosts));
    });
}
