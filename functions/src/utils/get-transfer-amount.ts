import { getFee } from './get-fee';

export async function getTransferAmount(amount: number, promotionCodeAmountOff: number) {
    amount += promotionCodeAmountOff;

    const fee = await getFee(amount);

    amount -= fee;

    // TODO - add support for different currencies
    return amount * 100;
}
