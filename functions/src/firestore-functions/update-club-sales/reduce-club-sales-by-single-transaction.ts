import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getClubSalesDocRef, tryGetClubSalesData } from '../get-data/get-club-sales-data';

interface ReduceClubSalesBySingleTransactionParams {
    isExclusiveEvent: boolean;
    clubId: string;
    revenueToReduce: number;
    isVip: boolean;
}

export async function reduceClubSalesBySingleTransaction({
    isExclusiveEvent,
    clubId,
    revenueToReduce,
    isVip,
}: ReduceClubSalesBySingleTransactionParams) {
    await firestoreDatabase().runTransaction(async (transaction) => {
        const clubSalesDocRef = getClubSalesDocRef(clubId);

        const clubSales = await tryGetClubSalesData(clubId, transaction);

        clubSales.ticketsSold--;

        clubSales.totalRevenue -= revenueToReduce;

        if (isExclusiveEvent) {
            clubSales.exclusiveTicketsSold--;
            clubSales.exclusiveEventsRevenue -= revenueToReduce;

            if (isVip) {
                clubSales.exclusiveVipsSold--;
            }
        }

        if (isVip) {
            clubSales.vipsSold--;
        }

        transaction.update(clubSalesDocRef, clubSales);
    });
}
