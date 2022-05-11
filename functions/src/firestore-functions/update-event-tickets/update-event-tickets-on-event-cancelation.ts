import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventTicketsDocRef,
    getEventTicketsOrReturnNotFound,
} from '../get-data/get-event-tickets-data';
import * as functions from 'firebase-functions';
import { TicketSales } from '../../models/ticket-sales';

export async function updateEventTicketsOnEventCancelation(
    event: Event,
    response: functions.Response
): Promise<void> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await getEventTicketsOrReturnNotFound(
            event.clubId,
            event.id,
            response,
            transaction
        );

        if (!tickets) return;

        transaction.update(eventTicketsDocRef, { ticketSales: resetTicketSales() } as EventTickets);
    });
}

function resetTicketSales() {
    return {
        ticketsSold: 0,
        vipsSold: 0,
        clubIncome: 0,
        totalRevenue: 0,
    } as TicketSales;
}
