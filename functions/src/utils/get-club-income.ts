import { getEventFeeAmount } from './get-event-fee-amount';

export function getClubIncome(amount: number, eventFee: number) {
    const fee = getEventFeeAmount(amount, eventFee);
    return amount - fee;
}
