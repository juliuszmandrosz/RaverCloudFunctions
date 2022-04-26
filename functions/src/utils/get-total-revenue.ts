import { getVipPrice } from '../firestore-functions/get-vip-price/get-vip-price';

export async function getTotalRevenue(eventPrice: number, isVip: boolean) {
    const vipPrice = isVip ? await getVipPrice({ eventPrice }) : 0;
    return eventPrice + vipPrice;
}
