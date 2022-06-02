import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { getClubSalesDocRef, tryGetClubSalesData } from '../get-data/get-club-sales-data';

interface UpdateClubSalesOnVipPaymentParams {
    isExclusiveEvent: boolean;
    clubId: string;
    revenue: number;
}

export async function updateClubSalesOnVipPayment({
    isExclusiveEvent,
    clubId,
    revenue,
}: UpdateClubSalesOnVipPaymentParams) {
    await firestoreDatabase().runTransaction(async (transaction) => {
        const clubSalesDocRef = getClubSalesDocRef(clubId);

        const clubSales = await tryGetClubSalesData(clubId, transaction);

        clubSales.vipsSold++;
        clubSales.totalRevenue += revenue;

        if (isExclusiveEvent) {
            clubSales.exclusiveEventsRevenue += revenue;
            clubSales.exclusiveVipsSold++;
        }

        transaction.update(clubSalesDocRef, clubSales);
    });
}
