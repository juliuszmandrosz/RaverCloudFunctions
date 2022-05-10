export function getPaymentMethodTypes(currency: string) {
    if (currency.toUpperCase() == 'PLN' || currency.toUpperCase() == 'EUR') {
        return ['card', 'p24'];
    }

    return ['card'];
}
