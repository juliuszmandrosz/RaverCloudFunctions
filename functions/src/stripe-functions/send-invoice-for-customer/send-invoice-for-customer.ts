import { stripe } from '../../modules/stripe-module';
import { getPaymentIntentAmount } from '../../utils/stripe-utils/get-payment-intent-amount';
import { getFunctionsConfig } from '../../utils/get-functions-config';

interface SendInvoiceForCustomerParams {
    customerId: string;
    revenue: number;
    serviceFee: number;
    currency: string;
    description: string;
    locale: string;
}

export async function sendInvoiceForCustomer({
    customerId,
    currency,
    revenue,
    serviceFee,
    description,
    locale,
}: SendInvoiceForCustomerParams) {
    const config = getFunctionsConfig().stripe;

    const ticketPrice = await stripe.prices.create({
        unit_amount: getPaymentIntentAmount(revenue),
        currency: currency,
        tax_behavior: 'inclusive',
        product_data: { name: description },
    });

    const feePrice = await stripe.prices.create({
        unit_amount: getPaymentIntentAmount(serviceFee),
        currency: currency,
        tax_behavior: 'inclusive',
        product_data: { name: getServiceFeeDescription(locale) },
    });

    await stripe.invoiceItems.create({
        customer: customerId,
        price: ticketPrice.id,
        tax_rates: [config.ticket_tax_rate],
    });

    await stripe.invoiceItems.create({
        customer: customerId,
        price: feePrice.id,
        tax_rates: [config.service_fee_tax_rate],
    });

    const invoice = await stripe.invoices.create({
        customer: customerId,
        description: description,
        collection_method: 'send_invoice',
        days_until_due: 0,
    });

    await stripe.invoices.pay(invoice.id, { paid_out_of_band: true });

    await stripe.invoices.sendInvoice(invoice.id);
}

function getServiceFeeDescription(locale: string) {
    if (locale === 'pl') {
        return 'Opłata serwisowa';
    }

    return 'Service fee';
}
