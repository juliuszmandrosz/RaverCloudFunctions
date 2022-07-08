import { Event } from '../../models/event';
import { EventTickets } from '../../models/event-tickets';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import {
    getEventTicketsDocRef,
    getEventTicketsOrReturnNotFound,
    tryGetEventTicketsData,
} from '../get-data/get-event-tickets-data';
import { reduceTicketSalesByQuantity } from '../update-ticket-sales/reduce-ticket-sales-by-quantity';
import { revertTicketQuantityFromPools } from '../update-ticket-pools/revert-ticket-quantity-from-pools';
import * as functions from 'firebase-functions';
import { getClubIncome } from '../../utils/get-club-income';
import { toJson } from '../../utils/json-utils';

interface UpdateEventTicketsOnCancelUsersPaymentSessionsParams {
    event: Event;
    canceledTicketSessionsQuantity: number;
    canceledVipSessionsQuantity: number;
    canceledFunds: number;
    response?: functions.Response;
}

/// Return event tickets after update or undefined
export async function updateEventTicketsOnCancelUsersPaymentSessions({
    event,
    canceledTicketSessionsQuantity,
    canceledVipSessionsQuantity,
    canceledFunds,
    response,
}: UpdateEventTicketsOnCancelUsersPaymentSessionsParams): Promise<EventTickets | undefined> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);

        const tickets = response
            ? await getEventTicketsOrReturnNotFound(event.clubId, event.id, response, transaction)
            : await tryGetEventTicketsData(event.clubId, event.id, transaction);

        if (!tickets) return;

        const eventFee = tickets.ticketSales.eventFee;
        const canceledClubIncome = getClubIncome(canceledFunds, eventFee);

        await reduceTicketSalesByQuantity({
            currentTicketSales: tickets.ticketSales,
            totalRevenueToReduce: canceledFunds,
            ticketQuantityToReduce: canceledTicketSessionsQuantity,
            vipQuantityToReduce: canceledVipSessionsQuantity,
            clubIncomeToReduce: canceledClubIncome,
        });

        await revertTicketQuantityFromPools(tickets, canceledTicketSessionsQuantity);

        transaction.update(eventTicketsDocRef, toJson(tickets));

        return tickets;
    });
}
