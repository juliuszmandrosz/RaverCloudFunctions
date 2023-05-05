import * as functions from 'firebase-functions';
import {firestoreDatabase} from '../modules/firebase-admin-module';
import {messages, participants, reviews, wallPhotos} from '../constants/collections';
import {firestore} from 'firebase-admin';
import {User} from '../models/user';
import {Review} from '../models/review';
import {Participant} from "../models/participant";
import {Message} from "../models/message";
import {updateDocRefsBatch} from "../utils/update-doc-refs-batch";
import DocumentSnapshot = firestore.DocumentSnapshot;

export async function onUserUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    const beforeUpdate = change.before.data() as User;
    const afterUpdate = change.after.data() as User;
    afterUpdate.id = change.after.id;

    if (beforeUpdate.username !== afterUpdate.username || beforeUpdate.profilePictureUrl !== afterUpdate.profilePictureUrl) {
        await updateReviews(afterUpdate);
        await updateWallPhotos(afterUpdate);
        await updateParticipants(afterUpdate);
        await updateMessages(afterUpdate);
    }
}

async function updateReviews(user: User) {
    const reviewsDocRefs = await firestoreDatabase()
        .collectionGroup(reviews)
        .where('userId', '==', user.id).get();

    await updateDocRefsBatch(reviewsDocRefs.docs.map(d => d.ref), {
        username: user.username,
        userPictureUrl: user.profilePictureUrl
    } as Review);
}


async function updateWallPhotos(user: User) {
    const photosDocRefs = await firestoreDatabase()
        .collection(wallPhotos)
        .where('userId', '==', user.id).get();

    await updateDocRefsBatch(photosDocRefs.docs.map(d => d.ref), {
        username: user.username,
        userProfilePhotoUrl: user.profilePictureUrl
    } as WallPhoto);
}

async function updateParticipants(user: User) {
    const participantsDocRefs = await firestoreDatabase()
        .collectionGroup(participants)
        .where('userId', '==', user.id).get()

    await updateDocRefsBatch(participantsDocRefs.docs.map(d => d.ref), {
        username: user.username,
        profilePictureUrl: user.profilePictureUrl
    } as Participant);
}

async function updateMessages(user: User) {
    const messagesDocRefs = await firestoreDatabase()
        .collectionGroup(messages)
        .where('userId', '==', user.id).get()

    await updateDocRefsBatch(messagesDocRefs.docs.map(d => d.ref), {
        username: user.username,
        userPictureUrl: user.profilePictureUrl
    } as Message);
}

