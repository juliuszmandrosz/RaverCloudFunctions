import { getClubFee } from './stripe-utils/get-club-fee';

export async function getClubIncome(amount: number) {
    const fee = await getClubFee(amount);
    return amount - fee;
}
