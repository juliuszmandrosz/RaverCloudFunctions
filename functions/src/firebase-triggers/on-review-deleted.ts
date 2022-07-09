import * as functions from 'firebase-functions';
import { Review } from '../models/review';
import { getClubDocRef } from '../firestore-functions/get-data/get-club-data';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { Club } from '../models/club';
import { toJson } from '../utils/json-utils';
import { clubs, eventReviews, reviewReports } from '../constants/collections';
import { EventReview } from '../models/event-review';
import { deleteQueryBatch } from '../utils/delete-query-batch';

export async function onReviewDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    context: functions.EventContext
) {
    const deletedReview = snapshot.data() as Review;
    deletedReview.id = snapshot.id;

    const clubId = context.params.clubId;

    const clubRef = getClubDocRef(clubId);

    await firestoreDatabase().runTransaction(async (transaction) => {
        const clubDoc = await transaction.get(clubRef);

        const club = clubDoc.data() as Club;

        const newReviewCount = club.reviewCount - 1;

        const newAvg =
            (club.reviewAvg * club.reviewCount - deletedReview.userRate) / newReviewCount;

        const roundedAvg = parseFloat(newAvg.toFixed(1));

        await updateEventReview(deletedReview, clubId);

        transaction.update(
            clubRef,
            toJson({
                reviewAvg: roundedAvg,
                reviewCount: newReviewCount,
            } as Club)
        );
    });

    await deleteReviewReport(deletedReview);
}

async function updateEventReview(deletedReview: Review, clubId: string) {
    await firestoreDatabase().runTransaction(async (transaction) => {
        const eventReviewRef = firestoreDatabase()
            .collection(clubs)
            .doc(clubId)
            .collection(eventReviews)
            .doc(deletedReview.eventId);

        const eventReviewDoc = await transaction.get(eventReviewRef);

        const eventReview = eventReviewDoc.data() as EventReview;

        const newReviewQuantity = eventReview.reviewQuantity - 1;

        const newAvg =
            (eventReview.reviewAvg * eventReview.reviewQuantity - deletedReview.userRate) /
            newReviewQuantity;

        const roundedAvg = parseFloat(newAvg.toFixed(1));

        transaction.update(
            eventReviewRef,
            toJson({
                reviewAvg: roundedAvg,
                reviewQuantity: newReviewQuantity,
            } as EventReview)
        );
    });
}

async function deleteReviewReport(deletedReview: Review) {
    const reviewReportsQuery = firestoreDatabase()
        .collection(reviewReports)
        .where('reviewId', '==', deletedReview.id)
        .limit(500);

    await deleteQueryBatch(reviewReportsQuery);
}
