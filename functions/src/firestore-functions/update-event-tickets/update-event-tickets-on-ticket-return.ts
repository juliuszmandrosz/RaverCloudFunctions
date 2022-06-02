import { EventTickets } from '../../models/event-tickets';
import { Event } from '../../models/event';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { reduceTicketSalesBySingleTransaction } from '../update-ticket-sales/reduce-ticket-sales-by-single-transaction';
import { revertSingleTicketFromPools } from '../update-ticket-pools/revert-single-ticket-from-pools';
import { getClubIncome } from '../../utils/get-club-income';
import { reduceClubSalesBySingleTransaction } from '../update-club-sales/reduce-club-sales-by-single-transaction';

interface UpdateEventTicketsOnTicketReturnParams {
    event: Event;
    isVip: boolean;
    returnedRevenue: number;
}

/// Return event tickets after update
export async function updateEventTicketsOnTicketReturn({
    event,
    isVip,
    returnedRevenue,
}: UpdateEventTicketsOnTicketReturnParams): Promise<EventTickets> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await tryGetEventTicketsData(event.clubId, event.id, transaction);

        const eventFee = tickets.ticketSales.eventFee;
        const clubIncomeToReduce = getClubIncome(returnedRevenue, eventFee);
        const isExclusiveEvent = tickets.ticketSales.isExclusiveEvent;

        await reduceTicketSalesBySingleTransaction({
            tickets,
            totalRevenueToReduce: returnedRevenue,
            isVip,
            clubIncomeToReduce,
        });

        await reduceClubSalesBySingleTransaction({
            isExclusiveEvent,
            clubId: event.clubId,
            isVip,
            revenueToReduce: returnedRevenue,
        });

        await revertSingleTicketFromPools(tickets);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
