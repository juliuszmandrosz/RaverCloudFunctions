import * as functions from 'firebase-functions';
import { newClub, newEvent, newReview } from './constants/collections';

export const env = functions.config();

exports.onReviewAdded = functions.firestore
    .document(newReview)
    .onCreate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-review-added')
        ).onReviewAdded(snapshot, context);
    });

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

exports.cancelEvent = functions.https.onCall(async (data, context) => {
    return (await import('./stripe-functions/cancel-event/cancel-event')).cancelEvent(
        data,
        context
    );
});

exports.postponeEvent = functions.https.onCall(async (data, context) => {
    return (await import('./stripe-functions/postpone-event/postpone-event')).postponeEvent(
        data,
        context
    );
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

exports.checkIfAccountExists = functions.https.onCall(async (data, context) => {
    return (
        await import('./auth-functions/check-account/check-if-account-exists')
    ).checkIfAccountExists(data, context);
});

exports.checkIfAccountNotExists = functions.https.onCall(async (data, context) => {
    return (
        await import('./auth-functions/check-account/check-if-account-not-exists')
    ).checkIfAccountNotExists(data, context);
});

exports.checkPartnerAccessCode = functions.https.onCall(async (data, context) => {
    return (
        await import('./firestore-functions/check-partner-access-code/check-partner-access-code')
    ).checkPartnerAccessCode(data, context);
});

exports.checkSelectorAccessCode = functions.https.onCall(async (data, context) => {
    return (
        await import('./firestore-functions/check-selector-access-code/check-selector-access-code')
    ).checkSelectorAccessCode(data, context);
});

exports.generateAccessCodeForSelector = functions.https.onCall(async (data, context) => {
    return (
        await import(
            './firestore-functions/generate-access-code-for-selector/generate-access-code-for-selector'
        )
    ).generateAccessCodeForSelector(data, context);
});

exports.useSelectorAccessCode = functions.https.onCall(async (data, context) => {
    return (
        await import('./firestore-functions/use-selector-access-code/use-selector-access-code')
    ).useSelectorAccessCode(data, context);
});
