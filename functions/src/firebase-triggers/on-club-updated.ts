import * as functions from 'firebase-functions';
import {Club} from '../models/club';
import {clubCollection} from '../modules/typesense-module';
import {DocumentSnapshot} from 'firebase-functions/lib/providers/firestore';
import {mapDataToAlgolia} from "../utils/map-data-to-algolia";
import {clubsIndex} from "../modules/algolia-module";
import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;

export async function onClubUpdated(
    change: functions.Change<DocumentSnapshot>,
    _: functions.EventContext
) {
    const updatedClub = change.after.data() as Club;
    updatedClub.id = change.after.id;

    await updateClubInTypesense(updatedClub);
    await updateClubInAlgolia(change.after.data()!, change.after.id);
}

async function updateClubInTypesense(club: Club) {
    await clubCollection.documents(club.id).update(club);
}

async function updateClubInAlgolia(data: DocumentData, id: string) {
    const object = mapDataToAlgolia(data, id);
    await clubsIndex.saveObject(object);
}
