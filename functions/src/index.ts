import * as functions from 'firebase-functions';
import { newClub, newEvent } from './constants/collections';

export const env = functions.config();

exports.onEventAdded = functions.firestore
    .document(newEvent)
    .onCreate(async (snapshot, context) => {
        await (await import('./firebase-triggers/on-event-added')).onEventAdded(snapshot, context);
    });

exports.onEventDeleted = functions.firestore
    .document(newEvent)
    .onDelete(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-event-deleted')
        ).onEventDeleted(snapshot, context);
    });

exports.onEventUpdated = functions.firestore
    .document(newEvent)
    .onUpdate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-event-updated')
        ).onEventUpdated(snapshot, context);
    });

exports.onClubAdded = functions.firestore.document(newClub).onCreate(async (snapshot, context) => {
    await (await import('./firebase-triggers/on-club-added')).onClubAdded(snapshot, context);
});

exports.onClubDeleted = functions.firestore
    .document(newClub)
    .onDelete(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-club-deleted')
        ).onClubDeleted(snapshot, context);
    });

exports.onClubUpdated = functions.firestore
    .document(newClub)
    .onUpdate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-club-updated')
        ).onClubUpdated(snapshot, context);
    });

exports.createTicketPaymentSheet = functions.https.onCall(async (data, context) => {
    return (
        await import('./stripe-functions/create-ticket-payment-sheet/create-ticket-payment-sheet')
    ).createTicketPaymentSheet(data, context);
});

exports.createVipPaymentSheet = functions.https.onCall(async (data, context) => {
    return (
        await import('./stripe-functions/create-vip-payment-sheet/create-vip-payment-sheet')
    ).createVipPaymentSheet(data, context);
});

exports.createEventCancelationPaymentSheet = functions.https.onCall(async (data, context) => {
    return (
        await import(
            './stripe-functions/create-event-cancelation-payment-sheet/create-event-cancelation-payment-sheet'
        )
    ).createEventCancelationPaymentSheet(data, context);
});

exports.createPostponeEventPaymentSheet = functions.https.onCall(async (data, context) => {
    return (
        await import(
            './stripe-functions/create-postpone-event-payment-sheet/create-postpone-event-payment-sheet'
        )
    ).createPostponeEventPaymentSheet(data, context);
});

exports.checkUserClaim = functions.https.onCall(async (data, context) => {
    return (await import('./auth-functions/check-claim/check-user-claim')).checkUserClaim(
        data,
        context
    );
});

exports.checkPartnerClaim = functions.https.onCall(async (data, context) => {
    return (await import('./auth-functions/check-claim/check-partner-claim')).checkPartnerClaim(
        data,
        context
    );
});

exports.checkSelectorClaim = functions.https.onCall(async (data, context) => {
    return (await import('./auth-functions/check-claim/check-selector-claim')).checkSelectorClaim(
        data,
        context
    );
});

exports.addUser = functions.https.onCall(async (data, context) => {
    return (await import('./firestore-functions/add-account/add-user')).addUser(data, context);
});

exports.addPartner = functions.https.onCall(async (data, context) => {
    return (await import('./firestore-functions/add-account/add-partner/add-partner')).addPartner(
        data,
        context
    );
});

exports.addSelector = functions.https.onCall(async (data, context) => {
    return (
        await import('./firestore-functions/add-account/add-selector/add-selector')
    ).addSelector(data, context);
});

exports.onAccountDeleted = functions.auth.user().onDelete(async (user, context) => {
    await (await import('./firebase-triggers/on-account-deleted')).onAccountDeleted(user, context);
});

exports.returnTicket = functions.https.onCall(async (data, context) => {
    return (await import('./stripe-functions/return-ticket/return-ticket')).returnTicket(
        data,
        context
    );
});

exports.onPaymentIntentSucceeded = functions.https.onRequest(async (request, response) => {
    await (
        await import('./stripe-webhooks/on-payment-intent-succeeded')
    ).onPaymentIntentSucceeded(request, response);
});

exports.onPaymentIntentRequiresAction = functions.https.onRequest(async (request, response) => {
    await (
        await import('./stripe-webhooks/on-payment-intent-requires-action')
    ).onPaymentIntentRequiresAction(request, response);
});

exports.cancelTicketReservationOnCloudTaskCallback = functions.https.onRequest(
    async (request, response) => {
        await (
            await import(
                './firestore-functions/cancel-ticket-reservation/cancel-ticket-reservation-on-cloud-task-callback'
            )
        ).cancelTicketReservationOnCloudTaskCallback(request, response);
    }
);

exports.cancelTicketReservationOnClosingPaymentSheet = functions.https.onCall(
    async (data, context) => {
        await (
            await import(
                './firestore-functions/cancel-ticket-reservation/cancel-ticket-reservation-on-closing-payment-sheet'
            )
        ).cancelTicketReservationOnClosingPaymentSheet(data, context);
    }
);

exports.payOutToPartnerOnCloudTaskCallback = functions.https.onRequest(
    async (request, response) => {
        await (
            await import(
                './stripe-functions/pay-out-to-partner/pay-out-to-partner-on-cloud-task-callback'
            )
        ).payOutToPartnerOnCloudTaskCallback(request, response);
    }
);

exports.cancelEventCancelationOnCloudTaskCallback = functions.https.onRequest(
    async (request, response) => {
        await (
            await import(
                './firestore-functions/cancel-event-cancelation/cancel-event-cancelation-on-cloud-task-callback'
            )
        ).cancelEventCancelationOnCloudTaskCallback(request, response);
    }
);

exports.cancelEventCancelationOnClosingPaymentSheet = functions.https.onCall(
    async (data, context) => {
        return (
            await import(
                './firestore-functions/cancel-event-cancelation/cancel-event-cancelation-on-closing-payment-sheet'
            )
        ).cancelEventCancelationOnClosingPaymentSheet(data, context);
    }
);

exports.cancelEventPostponeOnCloudTaskCallback = functions.https.onRequest(
    async (request, response) => {
        await (
            await import(
                './firestore-functions/cancel-event-postpone/cancel-event-postpone-on-cloud-task-callback'
            )
        ).cancelEventPostponeOnCloudTaskCallback(request, response);
    }
);

exports.cancelEventPostponeOnClosingPaymentSheet = functions.https.onCall(async (data, context) => {
    return (
        await import(
            './firestore-functions/cancel-event-postpone/cancel-event-postpone-on-closing-payment-sheet'
        )
    ).cancelEventPostponeOnClosingPaymentSheet(data, context);
});
