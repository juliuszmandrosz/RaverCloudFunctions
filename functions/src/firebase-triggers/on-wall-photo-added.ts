import * as functions from 'firebase-functions';
import {wallPhotoCollection} from '../modules/typesense-module';
import {firestoreDatabase} from "../modules/firebase-admin-module";
import {users} from "../constants/collections";


export async function onWallPhotoAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const wallPhoto = snapshot.data() as WallPhoto;
    wallPhoto.id = snapshot.id;

    await addWallPhotoToTypesense(wallPhoto);

    await incrementUserPhotosCount(wallPhoto.userId);
}

async function addWallPhotoToTypesense(wallPhoto: WallPhoto) {
    await wallPhotoCollection.documents().create(wallPhoto);
}

async function incrementUserPhotosCount(userId: string) {
    await firestoreDatabase().collection(users).doc(userId).update({
        photosCount: firestoreDatabase.FieldValue.increment(1)
    });
}
