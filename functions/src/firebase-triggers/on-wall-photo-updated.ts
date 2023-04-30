import * as functions from 'firebase-functions';
import {wallPhotoCollection} from '../modules/typesense-module';
import {DocumentSnapshot} from 'firebase-functions/lib/providers/firestore';
import {firebaseMessaging, firestoreDatabase} from "../modules/firebase-admin-module";
import {tryGetUserData} from "../firestore-functions/get-data/get-user-data";
import {users, wallPhotos} from "../constants/collections";
import {User} from "../models/user";

export async function onWallPhotoUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    const beforeUpdate = change.before.data() as WallPhoto;
    const afterUpdate = change.after.data() as WallPhoto;
    afterUpdate.id = change.after.id;

    await updateWallPhotoInTypesense(afterUpdate);

    const alreadyAttended = await checkIfUserAlreadyAttended(afterUpdate);

    if (!alreadyAttended && !beforeUpdate.isVerified && afterUpdate.isVerified) {
        const user = await tryGetUserData(afterUpdate.userId);
        await incrementUserRaverCoins(afterUpdate);
        await incrementUserAttendance(afterUpdate, user);
        await sendCloudMessageAfterPhotoVerification(afterUpdate, user);
    }

}

async function updateWallPhotoInTypesense(wallPhoto: WallPhoto) {
    await wallPhotoCollection.documents(wallPhoto.id).update(wallPhoto);
}

async function checkIfUserAlreadyAttended(photo: WallPhoto) {
    const otherPhotos = await firestoreDatabase()
        .collection(wallPhotos)
        .where('userId', '==', photo.userId)
        .where('eventId', '==', photo.eventId)
        .where('isVerified', '==', true)
        .get();
    return otherPhotos.size > 1;
}

async function incrementUserRaverCoins(photo: WallPhoto) {
    await firestoreDatabase().collection(users).doc(photo.userId).update({
        raverCoins: firestoreDatabase.FieldValue.increment(1)
    });
}

async function incrementUserAttendance(photo: WallPhoto, user: User) {
    const currentAttendance = user.attendance[photo.venueId] || 0;
    user.attendance[photo.venueId] = currentAttendance + 1;
    await firestoreDatabase().collection(users).doc(photo.userId).update({
        attendance: user.attendance
    });
}

async function sendCloudMessageAfterPhotoVerification(photo: WallPhoto, user: User) {
    const userTokens = user.pushNotificationTokens;
    if (!userTokens || userTokens?.length === 0) return;
    const title = getPhotoVerifiedTitle(user.locale);
    await firebaseMessaging().sendToDevice(
        userTokens,
        {
            notification: {
                title,
                body: photo.eventName,
            },
            data: {
                eventToRateId: photo.eventId,
            },
        },
        {
            priority: 'high',
            contentAvailable: true,
        }
    );
}

function getPhotoVerifiedTitle(locale: string) {
    return locale === 'pl' ?
        'Twoje zdjęcie zostało zweryfikowane pomyślnie, otrzymujesz nagrodę! Prosimy o ocenę wydarzenia.'
        : 'Your photo has been verified successfully, you get a reward! Please rate the event.';
}
