import * as functions from 'firebase-functions';
import {Club} from '../models/club';
import {clubCollection} from '../modules/typesense-module';
import {firestoreDatabase} from "../modules/firebase-admin-module";
import {clubsSales} from "../constants/collections";
import {ClubSales} from "../models/club-sales";
import {mapDataToAlgolia} from "../utils/map-data-to-algolia";
import {clubsIndex} from "../modules/algolia-module";
import {firestore} from "firebase-admin";
import DocumentData = firestore.DocumentData;

export async function onClubAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const club = snapshot.data() as Club;
    club.id = snapshot.id;

    await addClubToTypesense(club);
    await addClubToAlgolia(snapshot.data()!, snapshot.id);
    await addClubSales(club);
}

async function addClubToTypesense(club: Club) {
    await clubCollection.documents().create(club);
}

async function addClubToAlgolia(data: DocumentData, id: string) {
    const object = mapDataToAlgolia(data, id);
    await clubsIndex.saveObject(object);
}


async function addClubSales(club: Club) {
    await firestoreDatabase()
        .collection(clubsSales)
        .doc(club.id)
        .set({
            currency: club.acceptedCurrency,
            exclusiveEventsRevenue: 0,
            exclusiveTicketsSold: 0,
            exclusiveVipsSold: 0,
            ticketsSold: 0,
            totalRevenue: 0,
            vipsSold: 0,
        } as ClubSales);
}
