import * as functions from 'firebase-functions';
import { PayOutToPartnerRequest } from './pay-out-to-partner-request';
import { getEventTicketsOrReturnNotFound } from '../../firestore-functions/get-data/get-event-tickets-data';
import { getConnectedAccountDataOrReturnNotFound } from '../../firestore-functions/get-data/get-connected-account-data';
import { getEventCostsOrReturnNotFound } from '../../firestore-functions/get-data/get-event-costs-data';
import { EventPayoutTask } from '../../models/event-payout-task';
import { getEventPayoutTaskDocRef } from '../../firestore-functions/get-data/get-event-payout-task-data';
import { createPayout } from './create-payout';
import { getPayoutAmount } from './get-payout-amount';

export async function payOutToPartnerOnEventEnd(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const payoutToConnectedAccountRequest = request.body as PayOutToPartnerRequest;

    const event = payoutToConnectedAccountRequest.event;

    const eventTickets = await getEventTicketsOrReturnNotFound(event.clubId, event.id, response);

    if (!eventTickets) return;

    const clubIncome = eventTickets.ticketSales.clubIncome;

    if (!clubIncome) {
        response.send(200);
        return;
    }

    const connectedAccount = await getConnectedAccountDataOrReturnNotFound(event.clubId, response);

    if (!connectedAccount) return;

    const eventCosts = await getEventCostsOrReturnNotFound(event.clubId, event.id, response);

    if (!eventCosts) return;

    const payoutAmount = getPayoutAmount({
        clubIncome: eventTickets.ticketSales.clubIncome,
        eventPostponeBalance: eventCosts.eventPostponeBalance,
    });

    await createPayout({
        amount: payoutAmount,
        partnerId: event.clubId,
        currency: eventCosts.currency,
        connectedAccountId: connectedAccount.connectedAccountId,
    });

    await getEventPayoutTaskDocRef(event.id).update({ isCompleted: true } as EventPayoutTask);

    response.send();
}
