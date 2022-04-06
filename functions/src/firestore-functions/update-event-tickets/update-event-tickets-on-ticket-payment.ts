import { Event } from '../../models/event';
import { EventTickets } from '../../models/event-tickets';
import { TicketPool } from '../../models/ticket-pool';
import { getClubIncome } from '../../utils/get-club-income';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getTotalRevenue } from '../../utils/get-total-revenue';

/// Return event tickets after update
export async function updateEventTicketsOnTicketPayment(
    event: Event,
    isVip: boolean
): Promise<EventTickets> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await tryGetEventTicketsData(event.clubId, event.id, transaction);

        await updateTicketSales(tickets, event.price, isVip);

        await updateTicketPools(tickets);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}

async function updateTicketSales(tickets: EventTickets, eventPrice: number, isVip: boolean) {
    const ticketSales = tickets.ticketSales;

    ticketSales.ticketsSold++;
    if (isVip) {
        ticketSales.vipsSold++;
    }

    const totalRevenue = await getTotalRevenue(eventPrice, isVip);

    ticketSales.totalRevenue += totalRevenue;
    ticketSales.clubIncome += await getClubIncome(totalRevenue);
}

async function updateTicketPools(tickets: EventTickets) {
    const ticketPools = tickets.ticketPools;

    const currentPool = ticketPools.find((pool) => pool.isCurrent)!;

    currentPool.ticketsSold++;

    const isCurrentPoolSoldOut = currentPool.ticketsSold === currentPool.ticketQuantity;

    if (isCurrentPoolSoldOut) {
        currentPool.isSoldOut = true;
        currentPool.isCurrent = false;

        const lastPoolNumber = ticketPools[ticketPools.length - 1].poolNumber;
        const isLastPool = currentPool.poolNumber === lastPoolNumber;

        tickets.isSoldOut = isLastPool;

        if (!isLastPool) {
            startNextPool(currentPool, ticketPools);
        }
    }
}

function startNextPool(currentPool: TicketPool, ticketPools: TicketPool[]) {
    const nextPool = ticketPools.find((pool) => pool.poolNumber == currentPool.poolNumber + 1)!;
    nextPool.isCurrent = true;

    const index = ticketPools.indexOf(nextPool);
    ticketPools[index] = nextPool;
}
