import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getClubSalesDocRef, tryGetClubSalesData } from '../get-data/get-club-sales-data';

interface UpdateClubSalesOnTicketPaymentParams {
    isExclusiveEvent: boolean;
    clubId: string;
    isVip: boolean;
    revenue: number;
}

export async function updateClubSalesOnTicketPayment({
    isExclusiveEvent,
    clubId,
    isVip,
    revenue,
}: UpdateClubSalesOnTicketPaymentParams) {
    await firestoreDatabase().runTransaction(async (transaction) => {
        const clubSalesDocRef = getClubSalesDocRef(clubId);

        const clubSales = await tryGetClubSalesData(clubId, transaction);

        clubSales.ticketsSold++;

        clubSales.totalRevenue += revenue;

        if (isExclusiveEvent) {
            clubSales.exclusiveTicketsSold++;
            clubSales.exclusiveEventsRevenue += revenue;

            if (isVip) {
                clubSales.exclusiveVipsSold++;
            }
        }

        if (isVip) {
            clubSales.vipsSold++;
        }

        transaction.update(clubSalesDocRef, clubSales);
    });
}
