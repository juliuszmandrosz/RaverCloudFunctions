import * as functions from 'firebase-functions';
import {firestore} from "firebase-admin";
import {collectivesIndex} from "../../modules/algolia-module";
import {mapDataToAlgolia} from "../../utils/map-data-to-algolia";
import DocumentData = firestore.DocumentData;

export async function onCollectiveAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await addCollectiveToAlgolia(snapshot.data()!, snapshot.id);
}

async function addCollectiveToAlgolia(data: DocumentData, id: string) {
    const object = mapDataToAlgolia(data, id);
    await collectivesIndex.saveObject(object);
}
