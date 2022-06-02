import { Ticket } from '../../models/ticket';
import * as functions from 'firebase-functions';
import { EventTickets } from '../../models/event-tickets';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventTicketsDocRef,
    getEventTicketsOrReturnNotFound,
} from '../get-data/get-event-tickets-data';
import { getClubIncome } from '../../utils/get-club-income';
import { updateTicketSalesOnVipPayment } from '../update-ticket-sales/update-ticket-sales-on-vip-payment';
import { updateClubSalesOnVipPayment } from '../update-club-sales/update-club-sales-on-vip-payment';

interface UpdateEventTicketsOnVipPaymentParams {
    ticket: Ticket;
    vipPrice: number;
    response: functions.Response;
}

export async function updateEventTicketsOnVipPayment({
    ticket,
    vipPrice,
    response,
}: UpdateEventTicketsOnVipPaymentParams): Promise<EventTickets | undefined> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(ticket.clubId, ticket.eventId);
        const tickets = await getEventTicketsOrReturnNotFound(
            ticket.clubId,
            ticket.eventId,
            response,
            transaction
        );

        if (!tickets) return;

        const eventFee = tickets.ticketSales.eventFee;
        const clubIncome = getClubIncome(vipPrice, eventFee);
        const isExclusiveEvent = tickets.ticketSales.isExclusiveEvent;

        await updateTicketSalesOnVipPayment({ tickets, clubIncome, vipPrice });

        await updateClubSalesOnVipPayment({
            isExclusiveEvent,
            clubId: ticket.clubId,
            revenue: vipPrice,
        });

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
