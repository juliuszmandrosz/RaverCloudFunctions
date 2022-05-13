import { Event } from '../../models/event';
import { EventTickets } from '../../models/event-tickets';
import { TicketPool } from '../../models/ticket-pool';
import { getEventTicketsDocRef, tryGetEventTicketsData } from '../get-data/get-event-tickets-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getTotalRevenue } from '../../utils/get-total-revenue';
import { getClubIncome } from '../../utils/get-club-income';
import { getCurrentOrLastPool } from '../../utils/get-current-or-last-pool';

interface UpdateTicketSalesParams {
    tickets: EventTickets;
    eventPrice: number;
    vipPrice: number;
    isVip: boolean;
}

/// Returns event tickets after update
export async function updateEventTicketsOnTicketPayment(
    event: Event,
    isVip: boolean
): Promise<EventTickets> {
    return firestoreDatabase().runTransaction(async (transaction) => {
        const eventTicketsDocRef = getEventTicketsDocRef(event.clubId, event.id);
        const tickets = await tryGetEventTicketsData(event.clubId, event.id, transaction);
        const vipPrice = getCurrentOrLastPool(tickets.ticketPools).vipPrice;

        await updateTicketSales({ tickets, isVip, vipPrice, eventPrice: event.price });

        await updateTicketPools(tickets);

        transaction.update(eventTicketsDocRef, tickets);

        return tickets;
    });
}

async function updateTicketSales({
    tickets,
    eventPrice,
    vipPrice,
    isVip,
}: UpdateTicketSalesParams) {
    const ticketSales = tickets.ticketSales;

    ticketSales.ticketsSold++;

    if (isVip) {
        ticketSales.vipsSold++;
    }

    const totalRevenue = await getTotalRevenue({ isVip, vipPrice, eventPrice });

    ticketSales.totalRevenue += totalRevenue;
    ticketSales.clubIncome += await getClubIncome(totalRevenue);
}

async function updateTicketPools(tickets: EventTickets) {
    const ticketPools = tickets.ticketPools;

    const currentPool = getCurrentOrLastPool(ticketPools);
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
