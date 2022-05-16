import * as functions from 'firebase-functions';
import { PayOutToPartnerRequest } from './pay-out-to-partner-request';
import { getEventTicketsOrReturnNotFound } from '../../firestore-functions/get-data/get-event-tickets-data';
import { getConnectedAccountDataOrReturnNotFound } from '../../firestore-functions/get-data/get-connected-account-data';
import { getEventCostsOrReturnNotFound } from '../../firestore-functions/get-data/get-event-costs-data';
import { getEventPayoutTaskDocRef } from '../../firestore-functions/get-data/get-event-payout-task-data';
import { createPayout } from './create-payout';
import { getPayoutAmount } from './get-payout-amount';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { createPayoutToPartnerTask } from '../../cloud-tasks/payout-to-partner-task/create-payout-to-partner-task';
import { getEventDataOrReturnNotFound } from '../../firestore-functions/get-data/get-event-data';
import { cancelUsersPaymentSessions } from '../../firestore-functions/cancel-users-payment-sessions/cancel-users-payment-sessions';

export async function payOutToPartnerOnCloudTaskCallback(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const payoutToConnectedAccountRequest = request.body as PayOutToPartnerRequest;

    const eventId = payoutToConnectedAccountRequest.eventId;

    const event = await getEventDataOrReturnNotFound(eventId, response);

    if (!event) return;

    if (Timestamp.fromMillis(event.eventEndDateTime) > Timestamp.now()) {
        await createPayoutToPartnerTask({
            eventId,
            executesAt: Timestamp.fromMillis(event.eventEndDateTime),
        });

        response.send();

        return;
    }

    await cancelUsersPaymentSessions({ eventId, response });

    const eventTickets = await getEventTicketsOrReturnNotFound(event.clubId, event.id, response);

    if (!eventTickets) return;

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

    await getEventPayoutTaskDocRef(event.id).delete();

    response.send();
}
