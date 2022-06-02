import * as functions from 'firebase-functions';
import { stripe } from '../../modules/stripe-module';
import { CreatePaymentSheetForUserRequest } from './create-payment-sheet-for-user-request';
import { CreatePaymentSheetForUserResponse } from './create-payment-sheet-for-user-response';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { getPaymentIntentAmount } from '../../utils/stripe-utils/get-payment-intent-amount';
import { getPaymentMethodTypes } from '../../utils/stripe-utils/get-payment-method-types';
import { tryCreateEphemeralKey } from '../../utils/stripe-utils/try-create-ephemeral-key';
import { getStripeCustomerIdFromContext } from '../../utils/stripe-utils/get-stripe-customer-id-from-context';

export async function createPaymentSheetForUser(
    data: CreatePaymentSheetForUserRequest,
    context: functions.https.CallableContext
): Promise<CreatePaymentSheetForUserResponse> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    checkIfRequestIsValid(data);

    const amount = data?.amount;
    const description = data?.description;
    const currency = data?.currency;
    const userEmail = context.auth!.token.email!;

    const customerId = await getStripeCustomerIdFromContext(context);

    const ephemeralKeySecret = await tryCreateEphemeralKey(customerId);
    const paymentMethodTypes = getPaymentMethodTypes(currency);
    const paymentIntentAmount = getPaymentIntentAmount(amount);

    const paymentIntent = await stripe.paymentIntents.create({
        currency,
        description,
        amount: paymentIntentAmount,
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        receipt_email: userEmail,
    });

    if (!paymentIntent.client_secret) {
        const message = 'Error creating payment intent';
        throw new functions.https.HttpsError('internal', message);
    }

    return {
        customerId,
        ephemeralKeySecret,
        paymentIntentSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
}

function checkIfRequestIsValid(request: CreatePaymentSheetForUserRequest) {
    if (!request.amount) {
        const message = 'The function must be called with amount';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.currency) {
        const message = 'The function must be called with currency';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!request.description) {
        const message = 'The function must be called with description';
        throw new functions.https.HttpsError('invalid-argument', message);
    }
}
