import * as functions from 'firebase-functions';
import { Review } from '../models/review';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { Club } from '../models/club';
import { getClubDocRef } from '../firestore-functions/get-data/get-club-data';
import { clubs, eventReviews } from '../constants/collections';
import { EventReview } from '../models/event-review';

export async function onReviewAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    context: functions.EventContext
) {
    const review = snapshot.data()! as Review;

    const clubId = context.params.clubId;

    const clubRef = getClubDocRef(clubId);

    await firestoreDatabase().runTransaction(async (transaction) => {
        const clubDoc = await transaction.get(clubRef);

        const club = clubDoc.data() as Club;

        const newReviewCount = club.reviewCount + 1;

        const newAvg = (club.reviewAvg * club.reviewCount + review.userRate) / newReviewCount;

        const roundedAvg = parseFloat(newAvg.toFixed(1));

        await updateEventReview(review, clubId);

        transaction.update(clubRef, {
            reviewAvg: roundedAvg,
            reviewCount: newReviewCount,
        } as Club);
    });
}

async function updateEventReview(review: Review, clubId: string) {
    await firestoreDatabase().runTransaction(async (transaction) => {
        const eventReviewRef = firestoreDatabase()
            .collection(clubs)
            .doc(clubId)
            .collection(eventReviews)
            .doc(review.eventId);

        const eventReviewDoc = await transaction.get(eventReviewRef);

        const eventReview = eventReviewDoc.data() as EventReview;

        const newReviewQuantity = eventReview.reviewQuantity + 1;

        const newAvg =
            (eventReview.reviewAvg * eventReview.reviewQuantity + review.userRate) /
            newReviewQuantity;

        const roundedAvg = parseFloat(newAvg.toFixed(1));

        transaction.update(eventReviewRef, {
            reviewAvg: roundedAvg,
            reviewQuantity: newReviewQuantity,
        } as EventReview);
    });
}
