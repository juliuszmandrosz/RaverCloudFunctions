import * as functions from 'firebase-functions';
import {newClub, newEvent, newTicketPayment} from './constants/collections';

export const env = functions.config();


exports.onEventAdded = functions.firestore
    .document(newEvent)
    .onCreate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-event-added'))
            .onEventAdded(snapshot, context)
    });

exports.onEventDeleted = functions.firestore
    .document(newEvent)
    .onDelete(async (snapshot, context) => {
            await (
                await import('./firebase-triggers/on-event-deleted'))
                .onEventDeleted(snapshot, context)
        }
    );

exports.onEventUpdated = functions.firestore
    .document(newEvent)
    .onUpdate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-event-updated'))
            .onEventUpdated(snapshot, context)
    });


exports.onClubAdded = functions.firestore
    .document(newClub)
    .onCreate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-club-added'))
            .onClubAdded(snapshot, context)
    })


exports.onClubDeleted = functions.firestore
    .document(newClub)
    .onDelete(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-club-deleted'))
            .onClubDeleted(snapshot, context)
    });

exports.onClubUpdated = functions.firestore
    .document(newClub)
    .onUpdate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-club-updated'))
            .onClubUpdated(snapshot, context)
    });


exports.createTicketPaymentSheet =
    functions.https
        .onCall(async (data, context) => {
            return (
                await import('./stripe-functions/create-ticket-payment-sheet/create-ticket-payment-sheet'))
                .createTicketPaymentSheet(data, context)
        })

exports.onUserCreated =
    functions.auth
        .user()
        .onCreate(async (user, context) => {
            await (
                await import('./firebase-triggers/on-user-created'))
                .onUserCreated(user, context)
        })


exports.getVipPrice =
    functions.https
        .onCall(async (data, context) => {
            return (
                await import('./firestore-functions/get-vip-price/get-vip-price'))
                .getVipPrice(data, context)
        })


exports.onTicketPaymentAdded = functions.firestore
    .document(newTicketPayment)
    .onCreate(async (snapshot, context) => {
        await (
            await import('./firebase-triggers/on-ticket-payment-added'))
            .onTicketPaymentAdded(snapshot, context)
    })




