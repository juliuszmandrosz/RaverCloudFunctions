import * as functions from 'firebase-functions';
import {DocumentSnapshot} from 'firebase-functions/lib/providers/firestore';
import {firestore} from "firebase-admin";
import {mapDataToAlgolia} from "../../utils/map-data-to-algolia";
import {artistsIndex} from "../../modules/algolia-module";
import DocumentData = firestore.DocumentData;

export async function onArtistUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    await updateArtistInAlgolia(change.after.data()!, change.after.id);
}


async function updateArtistInAlgolia(data: DocumentData, id: string) {
    const object = mapDataToAlgolia(data, id);
    await artistsIndex.saveObject(object);
}
