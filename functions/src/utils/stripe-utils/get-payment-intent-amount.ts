export function getPaymentIntentAmount(amount: number) {
    // TODO - add currency support
    return Math.round(amount * 100);
}
