import { getEventFeeAmount } from './get-event-fee-amount';

export async function getClubIncome(amount: number, eventFee: number) {
    const fee = await getEventFeeAmount(amount, eventFee);
    return amount - fee;
}
