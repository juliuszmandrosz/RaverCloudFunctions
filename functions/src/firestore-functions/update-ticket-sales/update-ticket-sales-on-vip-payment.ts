import { Ticket } from '../../models/ticket';
import { EventTickets } from '../../models/event-tickets';

import * as functions from 'firebase-functions';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventTicketsDocRef,
    getEventTicketsOrReturnNotFound,
} from '../get-data/get-event-tickets-data';
import { getClubIncome } from '../../utils/get-club-income';

export async function updateTicketSalesOnVipPayment(
    ticket: Ticket,
    vipPrice: number,
    response: functions.Response
): Promise<EventTickets | undefined> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(ticket.clubId, ticket.eventId);
        const tickets = await getEventTicketsOrReturnNotFound(
            ticket.clubId,
            ticket.eventId,
            response,
            transaction
        );

        if (!tickets) return;

        await updateTicketSales(tickets, vipPrice);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}

async function updateTicketSales(tickets: EventTickets, vipPrice: number) {
    const ticketSales = tickets.ticketSales;
    const eventFee = tickets.ticketSales.eventFee;

    ticketSales.vipsSold++;
    ticketSales.totalRevenue += vipPrice;
    ticketSales.clubIncome += await getClubIncome(vipPrice, eventFee);
}
