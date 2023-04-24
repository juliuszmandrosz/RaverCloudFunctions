import * as functions from 'firebase-functions';
import {firestoreDatabase} from '../modules/firebase-admin-module';
import {reviews, wallPhotos} from '../constants/collections';
import {firestore} from 'firebase-admin';
import {updateDocRefsBatch} from '../utils/update-doc-refs-batch';
import {User} from '../models/user';
import {Review} from '../models/review';
import DocumentSnapshot = firestore.DocumentSnapshot;

export async function onUserUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    const beforeUpdate = change.before.data() as User;
    const afterUpdate = change.after.data() as User;
    afterUpdate.id = change.after.id;

    if (beforeUpdate.username !== afterUpdate.username) {
        await updateUsernameInReviews(afterUpdate);
        await updateUsernameInWallPhotos(afterUpdate);
    }


    if (beforeUpdate.profilePictureUrl !== afterUpdate.profilePictureUrl && afterUpdate.profilePictureUrl) {
        await updateUserPictureUrlInReviews(afterUpdate);
        await updateUserProfilePhotoUrlInWallPhotos(afterUpdate);
    }
}

async function updateUsernameInReviews(user: User) {
    const userReviews = await firestoreDatabase()
        .collectionGroup(reviews)
        .where('userId', '==', user.id)
        .get();

    const reviewDocRefs = userReviews.docs.map((doc) => doc.ref);

    await updateDocRefsBatch(reviewDocRefs, {username: user.username} as Review);
}


async function updateUserPictureUrlInReviews(user: User) {
    const userReviews = await firestoreDatabase()
        .collectionGroup(reviews)
        .where('userId', '==', user.id)
        .get();

    const reviewDocRefs = userReviews.docs.map((doc) => doc.ref);

    await updateDocRefsBatch(reviewDocRefs, {userPictureUrl: user.profilePictureUrl} as Review);
}

async function updateUsernameInWallPhotos(user: User) {
    const photos = await firestoreDatabase()
        .collection(wallPhotos)
        .where('userId', '==', user.id)
        .get();

    const photosDocRefs = photos.docs.map((doc) => doc.ref);

    await updateDocRefsBatch(photosDocRefs, {username: user.username} as WallPhoto);
}


async function updateUserProfilePhotoUrlInWallPhotos(user: User) {
    const photos = await firestoreDatabase()
        .collection(wallPhotos)
        .where('userId', '==', user.id)
        .get();

    const photosDocRefs = photos.docs.map((doc) => doc.ref);

    await updateDocRefsBatch(photosDocRefs, {userProfilePhotoUrl: user.profilePictureUrl} as WallPhoto);
}

