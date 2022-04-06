import * as functions from 'firebase-functions'
import {events, stripeCustomers} from '../../constants/collections';
import {apiVersion} from '../../constants/stripe-constants';
import {firestoreDatabase} from '../../modules/firebase-admin-module';
import {stripe} from '../../modules/stripe-module';
import {CreateTicketPaymentSheetRequest} from './create-ticket-payment-sheet-request';
import {CreateTicketPaymentSheetResponse} from './create-ticket-payment-sheet-response';
import {getVipPrice} from '../../firestore-functions/get-vip-price/get-vip-price';
import {StripeCustomer} from "../../models/stripe-customer";
import {Event} from "../../models/event";
import {getPromotionCode} from "../../firestore-functions/get-promotion-code/get-promotion-code";
import {throwInvalidEventError} from '../../errors/throw-invalid-event-error';


export async function createTicketPaymentSheet(
    data: CreateTicketPaymentSheetRequest,
    context: functions.https.CallableContext
): Promise<CreateTicketPaymentSheetResponse> {
    if (!context.auth) {
        const message = 'The function must be called while authenticated.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }

    const ticketPaymentId = data?.ticketPaymentId;
    const eventId = data?.eventId;

    if (!ticketPaymentId) {
        const message = 'The function must be called with ticket payment id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    if (!eventId) {
        const message = 'The function must be called with event id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const eventDoc = await firestoreDatabase().collection(events).doc(eventId).get();

    if (!eventDoc.exists) {
        throwInvalidEventError();
    }

    const event = eventDoc.data() as Event;
    event.id = eventDoc.id;
    const customerId = await getStripeCustomerId(context);
    const isVip = data?.isVip ?? false;
    const promotionCode = data?.promotionCode;


    const ephemeralKey = await stripe.ephemeralKeys.create(
        {customer: customerId},
        {apiVersion: apiVersion}
    );

    if (!ephemeralKey.secret) {
        const message = 'Error creating ephemeral key';
        throw new functions.https.HttpsError('internal', message);
    }

    const amount = await getAmount(event, isVip, context, promotionCode);
    const userEmail = context.auth.token.email!;
    const paymentIntent = await createPaymentIntent(
        event, amount, customerId, userEmail, ticketPaymentId);

    if (!paymentIntent.client_secret) {
        const message = 'Error creating payment intent';
        throw new functions.https.HttpsError('internal', message);
    }

    return {
        customerId,
        paymentIntentSecret: paymentIntent.client_secret,
        ephemeralKeySecret: ephemeralKey.secret,
        paymentIntentId: paymentIntent.id,
    }
}

async function getStripeCustomerId(context: functions.https.CallableContext): Promise<string> {
    const customer = await firestoreDatabase()
        .collection(stripeCustomers)
        .doc(context.auth!.uid)
        .get();

    return (customer.data() as StripeCustomer).customerId;
}


async function createPaymentIntent(
    event: Event,
    amount: number,
    customerId: string,
    userEmail: string,
    ticketPaymentId: string,
) {
    const paymentMethodTypes = getPaymentMethodTypes(event);

    return stripe.paymentIntents.create({
        amount: amount,
        currency: event.currency,
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        description: event.eventName,
        receipt_email: userEmail,
        transfer_group: ticketPaymentId,
        // TODO - change
        on_behalf_of: 'acct_1KhdCYRidFmpr8Rx',
    });
}

async function getAmount(
    event: Event,
    isVip: boolean,
    context: functions.https.CallableContext,
    promotionCode?: string,
) {
    let amount = event.price;

    if (promotionCode) {
        const result = await getPromotionCode({
                promotionCode: promotionCode
            },
            context
        );
        // TODO - add currency support for codes
        amount -= result.amountOff;
    }

    if (isVip) {
        const vipPrice = await getVipPrice({
            eventId: event.id,
        });
        amount += vipPrice;
    }

    return amount * 100;
}


function getPaymentMethodTypes(event: Event) {
    const currency = event.currency.toUpperCase();
    if (currency == 'PLN' || currency == 'EUR') {
        return ['card', 'p24'];
    }

    return ['card'];
}



