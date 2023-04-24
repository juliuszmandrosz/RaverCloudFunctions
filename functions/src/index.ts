import * as functions from 'firebase-functions';
import {
    newClub,
    newEvent,
    newEventTickets,
    newReview,
    newReward,
    newTicket,
    newUser,
    newWallPhoto,
} from './constants/collections';
import {CallableContext} from 'firebase-functions/lib/common/providers/https';

export const env = functions.config();

exports.onReviewAdded = functions
    .region('europe-central2')
    .firestore.document(newReview)
    .onCreate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-review-added')
        ).onReviewAdded(snapshot, context);
    });

exports.onEventAdded = functions
    .region('europe-central2')
    .firestore.document(newEvent)
    .onCreate(async (snapshot, context) => {
        await (await import('./firebase-triggers/on-event-added')).onEventAdded(snapshot, context);
    });

exports.onEventDeleted = functions
    .region('europe-central2')
    .firestore.document(newEvent)
    .onDelete(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-event-deleted')
        ).onEventDeleted(snapshot, context);
    });

exports.onEventUpdated = functions
    .region('europe-central2')
    .firestore.document(newEvent)
    .onUpdate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-event-updated')
        ).onEventUpdated(snapshot, context);
    });

exports.onClubAdded = functions
    .region('europe-central2')
    .firestore.document(newClub)
    .onCreate(async (snapshot, context) => {
        await (await import('./firebase-triggers/on-club-added')).onClubAdded(snapshot, context);
    });

exports.onClubDeleted = functions
    .region('europe-central2')
    .firestore.document(newClub)
    .onDelete(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-club-deleted')
        ).onClubDeleted(snapshot, context);
    });

exports.onClubUpdated = functions
    .region('europe-central2')
    .firestore.document(newClub)
    .onUpdate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-club-updated')
        ).onClubUpdated(snapshot, context);
    });

exports.onTicketAdded = functions
    .region('europe-central2')
    .firestore.document(newTicket)
    .onCreate(async (snapshot, context) => {
        await (await import('./firebase-triggers/on-ticket-added')).onTicketAdded(snapshot, context);
    });


exports.onTicketDeleted = functions
    .region('europe-central2')
    .firestore.document(newTicket)
    .onDelete(async (snapshot, context) => {
        await (await import('./firebase-triggers/on-ticket-deleted')).onTicketDeleted(snapshot, context);
    });

exports.onWallPhotoDeleted = functions
    .region('europe-central2')
    .firestore.document(newWallPhoto)
    .onDelete(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-wall-photo-deleted')
        ).onWallPhotoDeleted(snapshot, context);
    });

exports.onWallPhotoAdded = functions
    .region('europe-central2')
    .firestore.document(newWallPhoto)
    .onCreate(async (snapshot, context) => {
        await (await import('./firebase-triggers/on-wall-photo-added')).onWallPhotoAdded(snapshot, context);
    });

exports.onWallPhotoDeleted = functions
    .region('europe-central2')
    .firestore.document(newWallPhoto)
    .onDelete(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-wall-photo-deleted')
        ).onWallPhotoDeleted(snapshot, context);
    });

exports.onWallPhotoUpdated = functions
    .region('europe-central2')
    .firestore.document(newWallPhoto)
    .onUpdate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-wall-photo-updated')
        ).onWallPhotoUpdated(snapshot, context);
    });

exports.cancelEvent = functions.region('europe-central2').https.onCall(async (data, context) => {
    verifyApp(context);
    return (await import('./stripe-functions/cancel-event/cancel-event')).cancelEvent(
        data,
        context
    );
});

exports.postponeEvent = functions.region('europe-central2').https.onCall(async (data, context) => {
    verifyApp(context);
    return (await import('./stripe-functions/postpone-event/postpone-event')).postponeEvent(
        data,
        context
    );
});

exports.onAccountDeleted = functions
    .region('europe-central2')
    .auth.user()
    .onDelete(async (user, context) => {
        await (
            await import('./firebase-triggers/on-account-deleted')
        ).onAccountDeleted(user, context);
    });

exports.returnTicket = functions.region('europe-central2').https.onCall(async (data, context) => {
    verifyApp(context);
    return (await import('./stripe-functions/return-ticket/return-ticket')).returnTicket(
        data,
        context
    );
});

exports.onPaymentIntentSucceeded = functions
    .region('europe-central2')
    .https.onRequest(async (request, response) => {
        await (
            await import('./stripe-webhooks/on-payment-intent-succeeded')
        ).onPaymentIntentSucceeded(request, response);
    });

exports.onPaymentIntentRequiresAction = functions
    .region('europe-central2')
    .https.onRequest(async (request, response) => {
        await (
            await import('./stripe-webhooks/on-payment-intent-requires-action')
        ).onPaymentIntentRequiresAction(request, response);
    });

exports.cancelTicketReservationOnCloudTaskCallback = functions
    .region('europe-central2')
    .https.onRequest(async (request, response) => {
        await (
            await import(
                './firestore-functions/cancel-ticket-reservation/cancel-ticket-reservation-on-cloud-task-callback'
                )
        ).cancelTicketReservationOnCloudTaskCallback(request, response);
    });

exports.checkSelectorAccessCode = functions
    .region('europe-central2')
    .https.onCall(async (data, context) => {
        verifyApp(context);
        return (
            await import(
                './firestore-functions/check-selector-access-code/check-selector-access-code'
                )
        ).checkSelectorAccessCode(data, context);
    });

exports.generateAccessCodeForSelector = functions
    .region('europe-central2')
    .https.onCall(async (data, context) => {
        verifyApp(context);
        return (
            await import(
                './firestore-functions/generate-access-code-for-selector/generate-access-code-for-selector'
                )
        ).generateAccessCodeForSelector(data, context);
    });

exports.useSelectorAccessCode = functions
    .region('europe-central2')
    .https.onCall(async (data, context) => {
        verifyApp(context);
        return (
            await import('./firestore-functions/use-selector-access-code/use-selector-access-code')
        ).useSelectorAccessCode(data, context);
    });

exports.updateInvoiceData = functions
    .region('europe-central2')
    .https.onCall(async (data, context) => {
        verifyApp(context);
        return (
            await import('./stripe-functions/update-invoice-data/update-invoice-data')
        ).updateInvoiceData(data, context);
    });

exports.updateClubSalesOnEventEndCallback = functions
    .region('europe-central2')
    .https.onRequest(async (request, response) => {
        await (
            await import(
                './firestore-functions/update-club-sales/update-club-sales-on-event-end-callback'
                )
        ).updateClubSalesOnEventEndCallback(request, response);
    });

exports.onEventTicketsUpdated = functions
    .region('europe-central2')
    .firestore.document(newEventTickets)
    .onUpdate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-event-tickets-updated')
        ).onEventTicketsUpdated(snapshot, context);
    });

exports.onRewardAdded = functions
    .region('europe-central2')
    .firestore.document(newReward)
    .onCreate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-reward-added')
        ).onRewardAdded(snapshot, context);
    });

exports.onUserUpdated = functions
    .region('europe-central2')
    .firestore.document(newUser)
    .onUpdate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-user-updated')
        ).onUserUpdated(snapshot, context);
    });

exports.onReviewDeleted = functions
    .region('europe-central2')
    .firestore.document(newReview)
    .onDelete(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-review-deleted')
        ).onReviewDeleted(snapshot, context);
    });

exports.scheduledFirestoreExport = functions
    .region('europe-central2')
    .pubsub.schedule('every 24 hours')
    .onRun(async (context) => {
        await (
            await import('./cloud-schedulers/scheduled-firestore-export')
        ).scheduledFirestoreExport(context);
    });

// exports.addEventsFromJson = functions
//     .region('europe-central2')
//     .https.onRequest(async (request, response) => {
//         await (await import('./scripts/add-events-from-json')).addEventsFromJson(request, response);
//     });

function verifyApp(context: CallableContext) {
    // if (!context.app) {
    //     throw new functions.https.HttpsError(
    //         'failed-precondition',
    //         'The function must be called from an App Check verified app.'
    //     );
    // }
}
