import { stripe } from '../../modules/stripe-module';

interface SendInvoiceForCustomerParams {
    customerId: string;
    amount: number;
    currency: string;
    description: string;
}

export async function sendInvoiceForCustomer({
    customerId,
    currency,
    amount,
    description,
}: SendInvoiceForCustomerParams) {
    await stripe.invoiceItems.create({
        customer: customerId,
        description,
        // TODO - add support for different currencies
        amount: amount * 100,
        currency,
    });

    const invoice = await stripe.invoices.create({
        customer: customerId,
        description,
        collection_method: 'send_invoice',
        days_until_due: 0,
    });

    await stripe.invoices.pay(invoice.id, { paid_out_of_band: true });

    await stripe.invoices.sendInvoice(invoice.id);
}
