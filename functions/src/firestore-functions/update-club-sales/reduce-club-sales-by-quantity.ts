import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getClubSalesDocRef, tryGetClubSalesData } from '../get-data/get-club-sales-data';

interface ReduceClubSalesByQuantityParams {
    clubId: string;
    isExclusiveEvent: boolean;
    ticketQuantityToReduce: number;
    vipQuantityToReduce: number;
    revenueToReduce: number;
}

export async function reduceClubSalesByQuantity({
    clubId,
    isExclusiveEvent,
    ticketQuantityToReduce,
    vipQuantityToReduce,
    revenueToReduce,
}: ReduceClubSalesByQuantityParams) {
    await firestoreDatabase().runTransaction(async (transaction) => {
        const clubSalesDocRef = getClubSalesDocRef(clubId);

        const clubSales = await tryGetClubSalesData(clubId, transaction);

        clubSales.ticketsSold -= ticketQuantityToReduce;
        clubSales.vipsSold -= vipQuantityToReduce;
        clubSales.totalRevenue -= revenueToReduce;

        if (isExclusiveEvent) {
            clubSales.exclusiveTicketsSold -= ticketQuantityToReduce;
            clubSales.exclusiveVipsSold -= vipQuantityToReduce;
            clubSales.exclusiveEventsRevenue -= revenueToReduce;
        }

        transaction.update(clubSalesDocRef, clubSales);
    });
}
