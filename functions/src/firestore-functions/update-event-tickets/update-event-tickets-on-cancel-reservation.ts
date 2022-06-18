import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventTicketsDocRef,
    getEventTicketsOrReturnNotFound,
    tryGetEventTicketsData,
} from '../get-data/get-event-tickets-data';
import * as functions from 'firebase-functions';
import { reduceTicketSalesBySingleTransaction } from '../update-ticket-sales/reduce-ticket-sales-by-single-transaction';
import { revertSingleTicketFromPools } from '../update-ticket-pools/revert-single-ticket-from-pools';
import { getClubIncome } from '../../utils/get-club-income';

interface UpdateEventTicketsOnCancelReservationParams {
    event: Event;
    isVip: boolean;
    canceledAmount: number;
    response?: functions.Response;
}

/// Return event tickets after update or undefined
export async function updateEventTicketsOnCancelReservation({
    event,
    isVip,
    canceledAmount,
    response,
}: UpdateEventTicketsOnCancelReservationParams): Promise<EventTickets | undefined> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);

        const tickets = response
            ? await getEventTicketsOrReturnNotFound(event.clubId, event.id, response, transaction)
            : await tryGetEventTicketsData(event.clubId, event.id, transaction);

        if (!tickets) return;

        const eventFee = tickets.ticketSales.eventFee;
        const canceledClubIncome = getClubIncome(canceledAmount, eventFee);

        await reduceTicketSalesBySingleTransaction({
            tickets: tickets,
            isVip,
            totalRevenueToReduce: canceledAmount,
            clubIncomeToReduce: canceledClubIncome,
        });

        await revertSingleTicketFromPools(tickets);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
