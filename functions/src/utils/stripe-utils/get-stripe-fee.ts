import { Stripe } from 'stripe';
import * as functions from 'firebase-functions';
import { stripe } from '../../modules/stripe-module';

interface GetStripeFeeParams {
    paymentSessionId: string;
    response: functions.Response;
}

export async function getStripeFeeOrReturnNotFound(params: GetStripeFeeParams) {
    const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentSessionId, {
        expand: ['charges.data.balance_transaction'],
    });
    const balanceTransaction = paymentIntent.charges.data[0]
        .balance_transaction as Stripe.BalanceTransaction;
    const stripeFee = balanceTransaction.fee_details.find((fee) => fee.type === 'stripe_fee');

    if (!stripeFee) {
        params.response.status(404).send('Stripe fee for given payment session does not exists');
        return;
    }

    return stripeFee.amount / 100;
}
