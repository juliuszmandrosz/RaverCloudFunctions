import * as functions from 'firebase-functions';
import {wallPhotoCollection} from '../modules/typesense-module';
import {firestoreDatabase} from "../modules/firebase-admin-module";
import {users} from "../constants/collections";

export async function onWallPhotoDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const wallPhoto = snapshot.data() as WallPhoto;
    wallPhoto.id = snapshot.id;

    await deleteWallPhotoFromTypesense(wallPhoto.id);

    await decrementUserPhotosCount(wallPhoto.userId);
}

async function deleteWallPhotoFromTypesense(wallPhotoId: string) {
    await wallPhotoCollection.documents(wallPhotoId).delete();
}


async function decrementUserPhotosCount(userId: string) {
    await firestoreDatabase().collection(users).doc(userId).update({
        photosCount: firestoreDatabase.FieldValue.increment(-1)
    });
}
