import { getFee } from '../stripe-utils/get-fee';

export async function getClubIncome(amount: number) {
    const fee = await getFee(amount);
    return amount - fee;
}
