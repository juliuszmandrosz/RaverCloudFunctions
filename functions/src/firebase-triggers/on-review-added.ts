import * as functions from 'firebase-functions';
import { Review } from '../models/review';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { clubs } from '../constants/collections';
import { Club } from '../models/club';

export async function onReviewAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    context: functions.EventContext
) {
    const review = snapshot.data()! as Review;

    const clubId = context.params.clubId;

    const clubRef = firestoreDatabase().collection(clubs).doc(clubId);

    await firestoreDatabase().runTransaction(async (transaction) => {
        const clubDoc = await transaction.get(clubRef);

        const club = clubDoc.data() as Club;

        const newReviewCount = club.reviewCount + 1;

        const newAvg = (club.reviewAvg * club.reviewCount + review.userRate) / newReviewCount;

        const roundedAvg = parseFloat(newAvg.toFixed(1));

        transaction.update(clubRef, {
            reviewAvg: roundedAvg,
            reviewCount: newReviewCount,
        } as Club);
    });
}
