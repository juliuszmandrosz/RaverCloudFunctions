import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventCostsDocRef, tryGetEventCostsData } from '../get-data/get-event-costs-data';
import { tryGetStripeFee } from '../../utils/stripe-utils/get-stripe-fee';

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

        const ticketStripeFee = await tryGetStripeFee(params.ticketPaymentSessionId);

        let vipStripeFee = 0;

        if (params.vipPaymentSessionId) {
            vipStripeFee = await tryGetStripeFee(params.vipPaymentSessionId);
        }

        eventCosts.eventPostponeBalance -= ticketStripeFee;
        eventCosts.eventPostponeBalance -= vipStripeFee;

        transaction.update(eventCostsDocRef, eventCosts);
    });
}
