import { Event } from '../../models/event';
import { EventTickets } from '../../models/event-tickets';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getTotalRevenue } from '../../utils/get-total-revenue';
import { getCurrentOrLastPool } from '../../utils/get-current-or-last-pool';
import { getClubIncome } from '../../utils/get-club-income';
import { updateTicketSalesOnTicketPayment } from '../update-ticket-sales/update-ticket-sales-on-ticket-payment';
import { updateTicketPoolsOnTicketPayment } from '../update-ticket-pools/update-ticket-pools-on-ticket-payment';

/// Returns event tickets after update
export async function updateEventTicketsOnTicketPayment(
    event: Event,
    isVip: boolean
): Promise<EventTickets> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await tryGetEventTicketsData(event.clubId, event.id, transaction);
        const vipPrice = getCurrentOrLastPool(tickets.ticketPools).vipPrice;

        const eventFee = tickets.ticketSales.eventFee;
        const totalRevenue = getTotalRevenue({ isVip, vipPrice, ticketPrice: event.price });
        const clubIncome = getClubIncome(totalRevenue, eventFee);

        updateTicketSalesOnTicketPayment({ tickets, isVip, totalRevenue, clubIncome });

        await updateTicketPoolsOnTicketPayment(tickets);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}
