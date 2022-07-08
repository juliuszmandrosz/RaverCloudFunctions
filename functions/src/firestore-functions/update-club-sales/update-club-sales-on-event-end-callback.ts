import * as functions from 'firebase-functions';
import { getEventTicketsOrReturnNotFound } from '../get-data/get-event-tickets-data';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { cancelUsersPaymentSessions } from '../cancel-users-payment-sessions/cancel-users-payment-sessions';
import { UpdateClubSalesOnEventEndRequest } from './update-club-sales-on-event-end-request';
import { getEventDataOrReturnNotFound } from '../get-data/get-event-data';
import { createUpdateClubSalesOnEventEndTask } from '../../cloud-tasks/update-club-sales-on-event-end-task/create-update-club-sales-on-event-end-task';
import { getClubSalesOrReturnNotFound, getClubSalesDocRef } from '../get-data/get-club-sales-data';
import { toJson } from '../../utils/json-utils';

export async function updateClubSalesOnEventEndCallback(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const updateClubSalesOnEventEndRequest = request.body as UpdateClubSalesOnEventEndRequest;

    const clubId = updateClubSalesOnEventEndRequest.clubId;
    const eventId = updateClubSalesOnEventEndRequest.eventId;

    const event = await getEventDataOrReturnNotFound(eventId, response);

    if (!event) return;

    if (Timestamp.fromMillis(event.eventEndDateTime) > Timestamp.now()) {
        await createUpdateClubSalesOnEventEndTask({
            eventId,
            clubId,
            executesAt: Timestamp.fromMillis(event.eventEndDateTime),
        });

        response.send();

        return;
    }

    await cancelUsersPaymentSessions({ eventId, response });

    const eventTickets = await getEventTicketsOrReturnNotFound(clubId, eventId, response);

    if (!eventTickets) return;

    const clubSales = await getClubSalesOrReturnNotFound(clubId, response);

    if (!clubSales) return;

    const ticketSales = eventTickets.ticketSales;

    clubSales.ticketsSold += ticketSales.ticketsSold;
    clubSales.vipsSold += ticketSales.vipsSold;
    clubSales.totalRevenue += ticketSales.totalRevenue;

    if (ticketSales.isExclusiveEvent) {
        clubSales.exclusiveTicketsSold += ticketSales.ticketsSold;
        clubSales.exclusiveVipsSold += ticketSales.vipsSold;
        clubSales.exclusiveEventsRevenue += ticketSales.totalRevenue;
    }

    await getClubSalesDocRef(clubId).update(toJson(clubSales));

    response.send();
}
